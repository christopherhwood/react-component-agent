import React, { useCallback } from 'react';

export default function TestimonialsCarousel() {
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);
  const testimonials = [
    'From our Founder: "I spent hours stuck on a bug that no amount of Googling or ChatGPT assistance could resolve. With frontend studio, I iterated through three prompts and solved the issue in under 30 minutes. This is the power of frontend studio—turning days of development into a part of your productive morning."',
    "While premium components can be costly, frontend studio prides itself on understanding the intricacies of React and the DOM, like content-editable configurations, which are challenging even for seasoned developers. We offer a more affordable and agile solution to develop advanced features.",
    "frontend studio isn't just our product; it's our tool of choice. The UI of this site and frontend studio itself were crafted using frontend studio. We believe in drinking our own champagne, and it tastes like unprecedented efficiency and seamless design."
  ];

  const nextTestimonial = useCallback(() => {
    setCurrentTestimonial((prevIndex) => (prevIndex + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = useCallback(() => {
    setCurrentTestimonial(
      (prevIndex) =>
        (prevIndex - 1 + testimonials.length) % testimonials.length,
    );
  }, [testimonials.length]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        nextTestimonial();
      } else if (e.key === 'ArrowLeft') {
        prevTestimonial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextTestimonial, prevTestimonial]);

  return (
    <section
      id="testimonialsSection"
      className="p-4 sm:p-8 md:p-10 lg:p-12 bg-gray-800 text-gray-100 h-96 flex flex-col justify-center"
      aria-roledescription="carousel"
      aria-label="Testimonials carousel"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-green-500 font-bold text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10">
          Testimonials and Endorsements
        </h2>
        <div
          className="flex flex-col items-center space-y-4 sm:space-y-6 md:space-y-8 h-full justify-between"
          aria-live="polite"
          aria-atomic="true"
        >
          <blockquote
            className="italic text-sm sm:text-base md:text-lg lg:text-xl text-center shadow-lg overflow-y-auto max-h-60"
            aria-hidden="false"
            aria-label={`Testimonial ${currentTestimonial + 1} of ${testimonials.length}`}
          >
            {testimonials[currentTestimonial]}
          </blockquote>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={prevTestimonial}
              className="px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-gray-600"
              aria-controls="testimonialsSection"
              aria-label="Go to the previous testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`h-3 w-3 bg-gray-400 rounded-full ${index === currentTestimonial ? "bg-green-500" : ""} transition duration-300 ease-in-out`}
                onClick={() => setCurrentTestimonial(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
            <button
              onClick={nextTestimonial}
              className="px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
              aria-controls="testimonialsSection"
              aria-label="Go to the next testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          </div>
        </div>
    </section>
  );
}
