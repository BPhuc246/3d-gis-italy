import { Component, ReactNode } from 'react';

// Keep the photo tour and sidebar usable if WebGL or the map chunk fails.
export default class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="map-placeholder" role="status"><p className="eyebrow">BẢN ĐỒ TẠM THỜI CHƯA SẴN SÀNG</p><h2>Tiếp tục khám phá<br />qua những câu chuyện.</h2><p>Bạn vẫn có thể chọn địa điểm, xem mô hình và mở tour ảnh từ bảng bên.</p><button className="button secondary" style={{ alignSelf: 'flex-start', marginTop: 18 }} onClick={() => this.setState({ failed: false })}>Thử mở lại bản đồ</button></div>;
    return this.props.children;
  }
}
