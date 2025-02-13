const { createContext, useEffect, useLayoutEffect, useRef, useCallback} = require('react');
const PropTypes = require('prop-types');

const AccordionContext = createContext();

export default function Accordion({ header, children, setOpen, isOpen }) {

  const toggleAccordion = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  return (
    <AccordionContext.Provider value={{ toggleAccordion }}>
      <div className="border text-gray-300 border-gray-700 rounded-lg shadow-lg mx-4">
        <button
          className="flex justify-between items-center p-5 w-full text-left focus:outline-none text-sm sm:text-base md:text-lg"
          onClick={toggleAccordion}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              toggleAccordion();
              e.preventDefault(); // Prevent the default action to avoid scrolling on Space key
            }
          }}
          aria-expanded={isOpen}
          aria-controls="accordion-content"
        >
          <h2 className="font-semibold">{header}</h2>
          <span className="transform transition-transform duration-500 ease-in-out hover:scale-110" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
          </span>
        </button>
      </div>
      <Content isOpen={isOpen}>{children}</Content>
    </AccordionContext.Provider>
  );
}

function Content({ children, isOpen }) {
  const contentRef = useRef(null);

  useEffect(() => {
    const handleReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (handleReducedMotion.matches) {
      contentRef.current.style.transition = 'none';
    }
  }, []);

  useLayoutEffect(() => {
    const updateHeight = () => {
      const content = contentRef.current;
      if (isOpen) {
        content.style.height = `${content.scrollHeight}px`;
      } else {
        content.style.height = `0px`;
      }
    };

    updateHeight();
  }, [isOpen, children]);

  return (
    <div
      ref={contentRef}
      className="overflow-y-auto dark-scroll transition-height duration-300 ease-in-out"
      id="accordion-content"
      aria-hidden={!isOpen}
    >
      {children}
    </div>
  );
}

Accordion.propTypes = {
  header: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  setOpen: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};