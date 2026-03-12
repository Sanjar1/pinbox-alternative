import QRPoster from '@/components/QRPoster';

export default function PosterPreview() {
  return (
    <div style={{ background: '#E0D4B0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <QRPoster storeName="Авиасозлар" />
    </div>
  );
}
