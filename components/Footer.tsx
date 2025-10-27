export default function Footer() {
  return (
    <footer className="bg-teal-dark text-white py-8 text-center">
      <p className="text-sm opacity-80">
        © {new Date().getFullYear()} Parent Helper. All rights reserved.
      </p>
    </footer>
  );
}
