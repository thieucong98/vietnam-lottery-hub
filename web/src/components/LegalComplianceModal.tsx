import React, { useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Scale,
  AlertTriangle,
  HeartHandshake,
  BookOpen,
  Check,
  ExternalLink,
} from 'lucide-react';

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 860,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 45px -5px rgba(16, 185, 129, 0.25)',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.98)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="lottery-ball ball-emerald"
              style={{ width: 40, height: 40, fontSize: '1.1rem' }}
            >
              <Scale size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Tuyên Bố Pháp Lý, Miễn Trừ Trách Nhiệm & Chơi Có Trách Nhiệm (18+)
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Vietnam Lottery & Vietlott Hub • Tuân thủ pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Banner Cảnh Báo Trọng Tâm */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <ShieldCheck size={26} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.6 }}>
              <strong style={{ color: '#ffffff' }}>ĐỊNH VỊ HỌC THUẬT & KHOA HỌC DỮ LIỆU:</strong>
              <br />
              Nền tảng này được phát triển hoàn toàn vì mục đích <strong>nghiên cứu khoa học dữ liệu (Data Science), thống kê xác suất và kỹ thuật dữ liệu lớn (Data Engineering)</strong>. Nền tảng <strong>CHỈ</strong> thu thập và phân tích kết quả công khai của các sản phẩm xổ số hợp pháp do Nhà nước cấp phép (Xổ số kiến thiết 3 miền và Xổ số điện toán Vietlott).
            </div>
          </div>

          {/* 1. Xổ số hợp pháp vs Lô đề bất hợp pháp */}
          <div className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
              <Scale size={17} />
              <span>1. KHUNG PHÁP LÝ TẠI VIỆT NAM & BÀI TRỪ TỆ NẠN LÔ ĐỀ TRÁI PHÉP</span>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p>
                • <strong>Xổ số hợp pháp do Nhà nước phát hành:</strong> Hoạt động kinh doanh xổ số tại Việt Nam được điều chỉnh bởi <strong>Nghị định 30/2007/NĐ-CP</strong>, <strong>Nghị định 78/2012/NĐ-CP</strong> và <strong>Thông tư 75/2013/TT-BTC</strong> của Bộ Tài chính. Nguồn thu từ vé số truyền thống và vé Lô tô tự chọn của các Công ty XSKT Nhà nước, cùng Xổ số điện toán Vietlott (thành lập theo <strong>Quyết định 1108/QĐ-TTg</strong> của Thủ tướng Chính phủ) đều nộp vào ngân sách nhà nước nhằm phục vụ an sinh xã hội, xây dựng trường học, trạm y tế <em>("Ích nước - Lợi nhà")</em>.
              </p>
              <p>
                • <strong>Lô đề bất hợp pháp bị pháp luật nghiêm cấm:</strong> Mọi hành vi tham gia đánh bạc, ghi lô đề, tổ chức đánh bạc hoặc lập trang cá cược lô đề ngoài luồng đều vi phạm pháp luật hình sự nghiêm trọng theo <strong>Điều 321 (Tội đánh bạc)</strong> và <strong>Điều 322 (Tội tổ chức đánh bạc)</strong> của Bộ luật Hình sự 2015 (sửa đổi bổ sung 2017) với mức án lên đến 10 năm tù, hoặc bị xử phạt theo <strong>Điều 28 Nghị định 144/2021/NĐ-CP</strong>.
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                }}
              >
                <strong>NGHIÊM CẤM TUYỆT ĐỐI:</strong> Dự án không tổ chức cá cược, không làm trung gian ghi số, và nghiêm cấm bất kỳ ai sử dụng mã nguồn, dữ liệu hay thuật toán của dự án này vào các hoạt động cờ bạc, lô đề bất hợp pháp.
              </div>
            </div>
          </div>

          {/* 2. Miễn trừ trách nhiệm về kết quả & tài chính */}
          <div className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              <AlertTriangle size={17} />
              <span>2. MIỄN TRỪ TRÁCH NHIỆM KHOA HỌC & TÀI CHÍNH (NO GUARANTEE)</span>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p>
                • <strong>Bản chất ngẫu nhiên độc lập:</strong> Xổ số là trò chơi có bản chất biến cố ngẫu nhiên độc lập về mặt toán học. Mỗi kỳ quay thưởng đều được tổ chức độc lập dưới sự giám sát của Hội đồng Giám sát Xổ số gồm đại diện Bộ Công an, Bộ Tài chính và cơ quan tư pháp.
              </p>
              <p>
                • <strong>Thuật toán chỉ mang tính thống kê mô tả:</strong> Các thuật toán trong hệ thống (Markov, Poisson, Lô Gan, Bạc Nhớ 20 năm, Phân phối Gauss, Co-occurrence) chỉ mang giá trị <strong>nghiên cứu thực nghiệm dữ liệu lịch sử</strong>. Không một thuật toán hay AI nào có thể dự đoán chính xác kết quả mở thưởng trong tương lai.
              </p>
              <p>
                • <strong>Không cấu thành lời khuyên đầu tư:</strong> Mọi thông tin hiển thị trên trang web chỉ mang tính tham khảo giải trí, không phải lời khuyên đầu tư tài chính. Tác giả dự án được miễn trừ khỏi mọi trách nhiệm pháp lý hoặc tổn thất phát sinh từ quyết định của người dùng.
              </p>
            </div>
          </div>

          {/* 3. Chính sách chơi có trách nhiệm (18+) */}
          <div className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              <HeartHandshake size={17} />
              <span>3. NGUYÊN TẮC CHƠI CÓ TRÁCH NHIỆM (RESPONSIBLE GAMING - 18+)</span>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p>
                🔞 <strong>Giới hạn độ tuổi:</strong> Chỉ người từ đủ <strong>18 tuổi trở lên</strong> mới được phép mua vé số hợp pháp của Nhà nước.
              </p>
              <p>
                🎯 <strong>Mục đích giải trí:</strong> Chỉ mua vé số với tâm thế vui vẻ, giải trí trong khả năng tài chính và đóng góp ngân sách xây dựng đất nước.
              </p>
              <p>
                💰 <strong>Quản lý tài chính:</strong> Tuyệt đối không vay mượn tiền bạc, không cầm cố tài sản, và không xem việc mua vé số là phương tiện đầu tư hay công cụ kiếm sống.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Modal Action */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.98)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Xem toàn văn tài liệu tại file{' '}
            <code style={{ color: 'var(--accent-emerald)' }}>LEGAL_DISCLAIMER.md</code> trên kho mã nguồn GitHub.
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-emerald)',
              color: '#000000',
              fontWeight: 800,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Check size={16} />
            <span>Tôi Đã Hiểu & Đồng Ý</span>
          </button>
        </div>
      </div>
    </div>
  );
};
