import Link from 'next/link';

interface FooterProps {
  className?: string;
  showAllLinks?: boolean;
  fixed?: boolean;
  transparent?: boolean;
}

export function Footer({ className = '', showAllLinks = true, fixed = true, transparent = false }: FooterProps) {
  const bgClass = transparent ? 'bg-transparent' : 'bg-white';
  const borderClass = transparent ? 'border-teal-100/30' : 'border-gray-100';
  
  return (
    <footer className={`w-full px-6 md:px-8 lg:px-10 xl:px-12 py-1 flex justify-between items-center border-t ${borderClass} ${bgClass} ${fixed ? 'absolute bottom-0 left-0 right-0 z-10' : 'mt-1'} ${className}`}>
      <div className="text-xs text-gray-500">© 2025 Printalyzer - HelMi. All rights reserved.</div>
      <div className="flex space-x-2">
        <Link href="/privacy" className="text-xs text-gray-500 hover:text-[#00c2cb]">
          Privacy
        </Link>
        <Link href="/terms" className="text-xs text-gray-500 hover:text-[#00c2cb]">
          Terms
        </Link>
        {showAllLinks && (
          <>
            <Link href="/help" className="text-xs text-gray-500 hover:text-[#00c2cb]">
              Help
            </Link>
            <Link href="/contact" className="text-xs text-gray-500 hover:text-[#00c2cb]">
              Contact
            </Link>
          </>
        )}
      </div>
    </footer>
  );
}
