import React from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import EmailForm from "./components/EmailForm";
import TestimonialsAndEndorsements from "./components/Testimonials";
import { addToWaitlist } from "../../redux/slices/waitlistUserSlice";

function EmailSection({isSubmitted, submissionSuccess, submissionError, submissionLoading, email, handleEmailChange, handleSubmit}) {
  return (
    <section className="p-8 sm:pt-10 lg:pt-12">
        {isSubmitted && submissionSuccess ? (
          <section
            aria-labelledby="successMessageTitle"
            className="p-4 md:p-6 lg:p-8"
          >
            <h2 id="successMessageTitle" className="sr-only">
              Success Message
            </h2>
            <div
              aria-live="polite"
              aria-atomic="true"
              className="text-lg text-gray-100 text-center"
            >
              Thank you, <span className="font-bold">{email}</span>, for signing
              up! We&apos;ll be in touch soon with more updates on qckfx
              frontend studio.
            </div>
          </section>
        ) : (
          <EmailForm
            onSubmit={handleSubmit}
            email={email}
            submissionError={submissionError}
            loading={submissionLoading}
            onEmailChange={handleEmailChange}
          />
        )}
      </section>
  )
}

EmailSection.propTypes = {
  isSubmitted: PropTypes.bool.isRequired,
  submissionSuccess: PropTypes.bool.isRequired,
  submissionError: PropTypes.string,
  submissionLoading: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired,
  handleEmailChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

export default function LandingPage() {
  // TODO: Change to frontend-studio if already signed in
  const [email, setEmail] = React.useState("");
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const submissionSuccess = useSelector((state) => { return state.waitlistUser.email !== null });
  const submissionError = useSelector((state) => state.waitlistUser.error);
  const submissionLoading = useSelector((state) => state.waitlistUser.isLoading);
  const dispatch = useDispatch();

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(addToWaitlist({ email }));
    setIsSubmitted(true);
  };

  return (
    <div className="bg-gray-900 text-gray-100 flex flex-1 flex-col px-safe overflow-y-auto pt-8 sm:pt-10 lg:pt-12 h-full dark-scroll">
      <section className="flex flex-col xl:flex-row flex-1 items-center px-8 py-12 sm:py-6 lg:py-8 gap-y-4 sm:gap-y-8 justify-center">
        <div className="w-full xl:w-1/2 text-center xl:text-left ml-[3%] mr-[3%]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl lg:text-6xl font-bold text-green-500 sm:whitespace-nowrap">
            frontend studio <span className="text-l sm:text-xl md:text-2xl lg:text-3xl">by</span> <span className="px-1 font-extrabold text-gray-950 bg-green-500 tracking-wide italic">qckfx</span>
          </h1>
          <h2 className="text-xl sm:text-2xl mt-4">
            Transform Your Ideas Into Code Instantly with frontend studio
          </h2>
          <p className="mt-4">
            Empower your web development with our AI-driven React and Tailwind CSS code generator. Work less, create more.
          </p>
        </div>
        <div
          className="w-full flex justify-center items-center mt-8 sm:mt-0 px-2 sm:px-1 sm:w-full med:w-1/2 xl:w-2/5 pt-12 sm:pt-0"
          style={{ maxWidth: "100%" }}
        >
          <div
            className="w-full aspect-video"
            style={{ position: "relative" }}
          >
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/x3F1ZQh-Uf4"
              title="Demo video of qckfx, an automated coding solution"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>
      <EmailSection 
        isSubmitted={isSubmitted}
        submissionSuccess={submissionSuccess}
        submissionError={submissionError}
        submissionLoading={submissionLoading}
        email={email}
        handleEmailChange={handleEmailChange}
        handleSubmit={handleSubmit}
      />
      <section className="p-8 sm:pt-10 lg:pt-12 mx-auto">
        <h2 className="text-2xl text-green-500 font-bold text-center mb-6">
          Why Choose Frontend Studio?
        </h2>
        <ul className="space-y-4 text-lg font-normal">
          <li className="flex items-start gap-4">
            <img src={`${process.env.PUBLIC_URL}/programming-tool.png`} alt="Programming Tool" className="w-6 h-6 flex-none mt-1 dark:filter-none" aria-hidden="false" />
            Generate fully custom, complex components effortlessly: rich text editors, custom
            fields, tables, dropdowns, and more.
          </li>
          <li className="flex items-start gap-4">
            <img src={`${process.env.PUBLIC_URL}/react.png`} alt="React Logo" className="w-6 h-6 flex-none mt-1 dark:filter-none" aria-hidden="false" /> 
            Code with Intelligence: Utilize cutting-edge AI that understands
            coding best practices, from React contexts to hooks, and seamlessly
            integrates with state management systems like Redux.
          </li>
          <li className="flex items-start gap-4">
            <img src={`${process.env.PUBLIC_URL}/architecture-layers.png`} alt="Layers" className="w-6 h-6 flex-none mt-1 dark:filter-none" aria-hidden="false" /> 
            Maximize Reusability: Our AI crafts clean, maintainable, and
            reusable code, ensuring your components are versatile and
            future-proof.
          </li>
          <li className="flex items-start gap-4">
            <img src={`${process.env.PUBLIC_URL}/rocket.png`} alt="Rocketship" className="w-6 h-6 flex-none mt-1 dark:filter-none" aria-hidden="false" /> 
            Cost-Effective Development: Say goodbye to expensive component
            licensing. Frontend Studio delivers essential functionality at a
            fraction of the cost and integration effort.
          </li>
        </ul>
      </section>
      <TestimonialsAndEndorsements />
      <section
        aria-label="About Us"
        className="bg-gray-700 p-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 lg:p-12 mx-auto text-gray-200"
      >
        <h2
          id="aboutUsHeading"
          className="text-3xl md:text-4xl font-bold text-center mb-8 lg:mb-10"
        >
          About Us
        </h2>
        <div className="space-y-6 md:space-y-8 lg:space-y-10">
          <h3
            id="creatorHeading"
            className="text-xl md:text-2xl lg:text-3xl font-semibold"
          >
            The Creator:
          </h3>
          <p className="text-base md:text-lg leading-relaxed">
            I'm just a coder who loves to build stuff. After 9 years of coding,
            I made qckfx to help turn your ideas into real websites without all
            the hassle.
          </p>
          <h3
            id="qckfxHeading"
            className="text-xl md:text-2xl lg:text-3xl font-semibold"
          >
            What's qckfx?
          </h3>
          <p className="text-base md:text-lg leading-relaxed">
            It's a tool that takes what you want to make and turns it into code
            for you. It's like having a coding buddy who does the heavy lifting
            so you can focus on the fun parts of creating.
          </p>
        </div>
      </section>
      <EmailSection 
        isSubmitted={isSubmitted}
        submissionSuccess={submissionSuccess}
        submissionError={submissionError}
        submissionLoading={submissionLoading}
        email={email}
        handleEmailChange={handleEmailChange}
        handleSubmit={handleSubmit}
      />
      <footer className="p-4 flex justify-between text-left">
        <p>San Francisco, CA</p>
        <p>© Earlyworm, LLC</p>
      </footer>
    </div>
  );
}
