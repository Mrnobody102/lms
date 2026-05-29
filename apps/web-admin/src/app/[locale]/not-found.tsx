import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Decorative background blobs */}
        <div className="relative mb-10">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-primary/8 blur-2xl pointer-events-none" />

          {/* 404 number */}
          <div className="relative">
            <p className="text-[9rem] font-black leading-none tracking-tighter bg-gradient-to-br from-primary via-primary/70 to-primary/30 bg-clip-text text-transparent select-none">
              404
            </p>
          </div>
        </div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Trang không tồn tại</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.
          <br />
          Hãy kiểm tra lại URL hoặc quay về trang chủ.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
              />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Về trang chủ
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </button>
        </div>

        {/* Footer hint */}
        <p className="mt-10 text-xs text-muted-foreground/60">
          LMS Admin Portal &nbsp;·&nbsp; Mã lỗi 404
        </p>
      </div>
    </div>
  );
}
