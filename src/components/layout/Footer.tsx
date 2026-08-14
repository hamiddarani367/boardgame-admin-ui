export default function Footer() {
  return (
    <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground bg-card">
      © {new Date().getFullYear()} Board Kingdom. تمامی حقوق محفوظ است.
    </footer>
  );
}