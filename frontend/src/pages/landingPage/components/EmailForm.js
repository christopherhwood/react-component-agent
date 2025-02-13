import React from 'react';
import PropTypes from "prop-types";

export default function EmailForm({ onSubmit, email, submissionError, loading, onEmailChange }) {
  const [emailError, setEmailError] = React.useState("");

  const validateEmail = (e) => {
    const email = e.target.value;
    const regex = /^\S+@\S+\.\S+$/;
    if (!regex.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
    onEmailChange(e);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 mx-auto">
      <label htmlFor="emailInput" className="sr-only">
        Email address
      </label>
      <p className="text-center">
        Join our waitlist today and be among the first to streamline your development process.
      </p>
      <div className="flex w-full flex-col max-w-[50%] lg:max-w-[35%] mx-auto gap-4">
        <input
          id="emailInput"
          type="email"
          value={email}
          onChange={validateEmail}
          placeholder="Enter your email"
          className={`p-2 rounded hover:bg-gray-700 focus:bg-gray-700 ${emailError || submissionError ? "border-red-500" : "focus:ring-4 focus:ring-green-500"} focus:outline-none transition-colors duration-150 bg-gray-950 text-gray-400`}
          aria-describedby="emailError submissionError"
          required
          disabled={loading}
        />
        {emailError && (
          <p
            id="emailError"
            className="text-red-500 text-sm mt-1"
            aria-live="polite"
          >
            {emailError}
          </p>
        )}
        {submissionError && (
          <p
            id="submissionError"
            className="text-red-500 text-sm mt-1"
            aria-live="polite"
          >
            {submissionError}
          </p>
        )}
        <button
          type="submit"
          className={`bg-green-500 text-gray-950 font-semibold p-2 rounded hover:bg-green-600 focus:bg-green-700 focus:ring-4 focus:ring-green-300 focus:outline-none transition-colors duration-150 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Join the waitlist"}
        </button>
      </div>
    </form>
  );
}

EmailForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
  submissionError: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  onEmailChange: PropTypes.func.isRequired,
};