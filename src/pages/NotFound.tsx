import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="text-6xl font-bold" style={{ color: "var(--accent)" }}>404</div>
      <h1 className="text-2xl font-bold">Sayfa bulunamadı</h1>
      <p className="text-muted text-sm max-w-md">
        Aradığınız adres mevcut değil veya taşınmış olabilir. Aşağıdaki bağlantılardan birini kullanarak devam edin.
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        <Link to="/" className="btn-primary">Panoya Git</Link>
        <Link to="/kullanim-talimati" className="btn-ghost">Kullanım Talimatı</Link>
      </div>
    </div>
  );
}
