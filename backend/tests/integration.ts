import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { env } from '../src/config/env';

async function main() {
  const host = new URL(env.DB_POSTGRES).hostname;
  assert(env.NODE_ENV !== 'production' && ['localhost','127.0.0.1','::1','[::1]'].includes(host), 'Integration test requires a local non-production database.');
  const prefix = `qa-${randomUUID()}`;
  const created: string[] = [];
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  let checks = 0;
  async function request(path: string, method = 'GET', body?: unknown, token?: string, status = 200) {
    const response = await fetch(base + '/api' + path, {
      method, headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:5173', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
    checks++; return data;
  }
  try {
    assert.equal((await request('/health')).db, 'connected');
    const destination = await request('/destinations/colosseum');
    const destinationId = destination.destinationId;
    const password = 'Roma-QA-2026!';
    const email = `${prefix}.a@example.test`;
    await request('/auth/register','POST',{ fullName:'QA',email,password:'short' },undefined,400);
    await request('/auth/register','POST',{ fullName:'QA',email,password:'é'.repeat(40) },undefined,400);
    const a = await request('/auth/register','POST',{fullName:'QA User A',email:email.toUpperCase(),password},undefined,201);
    created.push(a.user.userId); assert.equal(a.user.email,email); assert(!('password_hash' in a.user));
    const stored = await pool.query('SELECT password_hash FROM users WHERE user_id=$1',[a.user.userId]);
    assert.notEqual(stored.rows[0].password_hash,password); assert(await bcrypt.compare(password,stored.rows[0].password_hash));
    await request('/auth/register','POST',{fullName:'Duplicate',email,password},undefined,409);
    await request('/auth/login','POST',{email,password:'wrong'},undefined,401);
    const login = await request('/auth/login','POST',{email:email.toUpperCase(),password});
    assert.equal(login.user.userId,a.user.userId);
    assert.equal((await request('/auth/me','GET',undefined,login.token)).userId,a.user.userId);
    await request('/auth/me','GET',undefined,undefined,401);
    await request('/auth/me','GET',undefined,'invalid-token',401);
    const expired = jwt.sign({userId:a.user.userId},env.JWT_SECRET,{expiresIn:-1});
    await request('/auth/me','GET',undefined,expired,401);
    const b = await request('/auth/register','POST',{fullName:'QA User B',email:`${prefix}.b@example.test`,password},undefined,201);
    created.push(b.user.userId);
    await request('/destinations/colosseum/review','PUT',{rating:5},undefined,401);
    for (const rating of [0,6,2.5,'5']) await request('/destinations/colosseum/review','PUT',{rating},a.token,400);
    await request('/destinations/colosseum/review','PUT',{rating:5,comment:'x'.repeat(2001)},a.token,400);
    await request('/destinations/not-a-real-place/review','PUT',{rating:5},a.token,404);
    const first = await request('/destinations/colosseum/review','PUT',{rating:4,comment:'  QA first review  '},a.token);
    assert.equal(first.authorName,'QA User A'); assert.equal(first.comment,'QA first review');
    const updated = await request('/destinations/colosseum/review','PUT',{rating:5,comment:'QA edited review'},a.token);
    assert.equal(updated.reviewId,first.reviewId); assert.equal(updated.comment,'QA edited review');
    await request('/destinations/colosseum/review','PUT',{rating:3,comment:'QA B',userId:a.user.userId},b.token);
    let detail = await request('/destinations/colosseum','GET',undefined,a.token);
    assert.equal(detail.myReview.userId,a.user.userId); assert.equal(detail.myReview.rating,5);
    assert.equal((await request('/destinations/colosseum','GET',undefined,b.token)).myReview.rating,3);
    // A user's own review must remain editable even outside the newest 20 public rows.
    // Insert 21 newer rows without changing any pre-existing review.
    for (let i=0;i<21;i++) {
      const id=randomUUID(); created.push(id);
      await pool.query('INSERT INTO users(user_id,full_name,email,password_hash) VALUES($1,$2,$3,$4)',[id,'QA pagination',`${prefix}.extra.${i}@example.test`,stored.rows[0].password_hash]);
      await pool.query('INSERT INTO review(user_id,destination_id,rating,comment) VALUES($1,$2,4,$3)',[id,destinationId,'QA pagination']);
    }
    detail = await request('/destinations/colosseum','GET',undefined,a.token);
    assert.equal(detail.reviews.length,20); assert(!detail.reviews.some((r: any)=>r.reviewId===first.reviewId));
    assert.equal(detail.myReview.reviewId,first.reviewId);
    const stats = await pool.query('SELECT COUNT(*)::int AS count, ROUND(AVG(rating)::numeric,1)::float8 AS avg FROM review WHERE destination_id=$1',[destinationId]);
    assert.equal(detail.reviewCount,stats.rows[0].count); assert.equal(detail.avgRating,stats.rows[0].avg);
    await request('/destinations/colosseum/favorite','POST',undefined,undefined,401);
    await request('/destinations/colosseum/favorite','POST',undefined,a.token,201);
    await request('/destinations/colosseum/favorite','POST',undefined,a.token,201);
    let favorites=await request('/me/favorites','GET',undefined,a.token);
    assert.equal(favorites.length,1); assert.equal(favorites[0].slug,'colosseum');
    assert.equal((await request('/me/favorites','GET',undefined,b.token)).length,0);
    // Login again and fresh GETs exercise persistence, rather than reusing client state.
    const session=await request('/auth/login','POST',{email,password});
    detail=await request('/destinations/colosseum','GET',undefined,session.token);
    assert.equal(detail.isFavorite,true); assert.equal(detail.myReview.comment,'QA edited review');
    await request('/destinations/colosseum/review','DELETE',undefined,b.token);
    assert.equal((await request('/destinations/colosseum','GET',undefined,a.token)).myReview.reviewId,first.reviewId);
    await request('/destinations/colosseum/favorite','DELETE',undefined,a.token);
    assert.equal((await request('/me/favorites','GET',undefined,a.token)).length,0);
    await request('/destinations/colosseum/review','DELETE',undefined,a.token);
    assert.equal((await request('/destinations/colosseum','GET',undefined,a.token)).myReview,null);
    const preflight=await fetch(base+'/api/auth/login',{method:'OPTIONS',headers:{Origin:'http://127.0.0.1:5173','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,authorization'}});
    assert.equal(preflight.headers.get('access-control-allow-origin'),'http://127.0.0.1:5173');
    console.log(`PASS: ${checks} API checks with real PostgreSQL: register/login, validation, auth, password hash, review ownership/edit/delete/pagination, rating stats, favorite idempotence/isolation, fresh-session persistence, local CORS.`);
  } finally {
    // Delete only this run's exact account IDs with its unique email prefix.
    if (created.length) await pool.query('DELETE FROM users WHERE user_id=ANY($1::uuid[]) AND email LIKE $2',[created,`${prefix}.%@example.test`]);
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  }
}
main().catch(error=>{ console.error(error); process.exitCode=1; }).finally(()=>pool.end());
