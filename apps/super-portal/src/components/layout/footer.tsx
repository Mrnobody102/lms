export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto py-6 border-t bg-card/30 text-center text-muted-foreground text-sm font-medium">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span>&copy; {year} LMS Platform SaaS. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            System Status
          </a>
        </div>
      </div>
    </footer>
  );
}
