import Link from "next/link";
import { Book } from "@/components/ui/book";

export interface LibraryBook {
  url: string;
  title: string;
  description?: string;
  cover?: string;
}

const coverColors = [
  "var(--kk-patch-11)",
  "var(--kk-patch-6)",
  "var(--kk-patch-3)",
  "var(--kk-patch-8)",
  "var(--kk-patch-12)",
  "var(--kk-patch-2)",
  "var(--kk-patch-9)",
  "var(--kk-patch-5)",
];

export function BooksLibrary({ books }: { books: LibraryBook[] }) {
  return (
    <section className="kk-library" aria-labelledby="library-heading">
      <div className="kk-library-heading">
        <p className="kk-label">The written treasury</p>
        <h2 id="library-heading">Read from the shelf</h2>
        <p>
          Books, lecture notes, and teachings published from the shared AFFiNE library.
          Choose a volume to enter its reading page.
        </p>
      </div>
      <div className="kk-library-shelf">
        {books.map((book, index) => (
          <Link
            key={book.url}
            href={book.url}
            className="kk-library-book"
            aria-label={`Read ${book.title}`}
            data-no-popover
          >
            <Book
              title={book.title}
              cover={book.cover}
              eager={index < 4}
              color={coverColors[index % coverColors.length]}
              textColor={index % 3 === 2 ? "var(--kk-night)" : "var(--kk-night-fg)"}
              variant={index % 4 === 3 ? "simple" : "stripe"}
            />
            <span className="kk-library-meta">
              <strong>{book.title}</strong>
              {book.description && <span>{book.description}</span>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
