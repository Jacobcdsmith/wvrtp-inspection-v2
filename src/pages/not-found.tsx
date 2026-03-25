import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-6">Page not found.</p>
        <Link href="/">
          <span className="text-primary font-semibold hover:underline">Go to Inspection Form</span>
        </Link>
      </div>
    </div>
  );
}
