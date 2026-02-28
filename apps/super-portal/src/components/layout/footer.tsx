import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("SuperPortal.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto py-6 border-t bg-card/30 text-center text-muted-foreground text-sm font-medium">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span>
          &copy; {year} LMS Platform SaaS. {t("rights")}
        </span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Status
          </a>
        </div>
      </div>
    </footer>
  );
}
