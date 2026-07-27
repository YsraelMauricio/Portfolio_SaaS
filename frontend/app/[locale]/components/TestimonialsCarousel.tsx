'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  author_name: string;
  role: string | null;
  content: string;
  rating: number | null;
}

export default function TestimonialsCarousel() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/testimonials`)
      .then((res) => res.json())
      .then(({ data }) => setItems(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[index];

  return (
    <div className="glass-card--light p-8 sm:p-10 text-center transition-opacity duration-500" key={index}>
      <p className="text-lg text-text italic mb-6">&ldquo;{current.content}&rdquo;</p>
      <p className="font-display font-semibold text-text">{current.author_name}</p>
      {current.role && <p className="text-sm text-text-muted">{current.role}</p>}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Testimonial ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-accent' : 'bg-text-muted/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
