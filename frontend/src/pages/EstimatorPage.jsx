import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConfig, submitEstimate, ApiError } from "../api/client.js";
import QuestionField from "../components/QuestionField.jsx";
import ProgressSteps from "../components/ProgressSteps.jsx";
import ContactForm from "../components/ContactForm.jsx";
import EstimateResult from "../components/EstimateResult.jsx";

const initialContact = { name: "", phone: "", email: "" };

function validateQuestionClientSide(question, value) {
  if (question.required && (value === undefined || value === null || value === "")) {
    return `${question.label} is required.`;
  }
  if (question.type === "number" && value !== "" && value !== undefined) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "Enter a number.";
    if (question.min !== undefined && n < question.min)
      return `Must be at least ${question.min}.`;
    if (question.max !== undefined && n > question.max)
      return `Must be at most ${question.max}.`;
  }
  return null;
}

export default function EstimatorPage() {
  const [loadState, setLoadState] = useState("loading"); // loading | error | ready
  const [loadError, setLoadError] = useState("");
  const [config, setConfig] = useState(null);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState(initialContact);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  async function loadConfig() {
    setLoadState("loading");
    setLoadError("");
    try {
      const data = await getConfig();
      setConfig(data);
      document.title = `${data.business?.name || "Roofing"} — Estimate`;
      setLoadState("ready");
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong loading the estimator."
      );
      setLoadState("error");
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  const questions = config?.questions || [];
  const totalSteps = questions.length + 1; // + contact step
  const currentQuestion = step < questions.length ? questions[step] : null;
  const onContactStep = step === questions.length;

  const currency = config?.business?.currency || "USD";

  function handleAnswerChange(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleNextFromQuestion() {
    const err = validateQuestionClientSide(currentQuestion, answers[currentQuestion.key]);
    if (err) {
      setErrors((prev) => ({ ...prev, [currentQuestion.key]: err }));
      return;
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    setSubmitError("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    const contactErrors = {};
    if (!contact.name.trim()) contactErrors.name = "Name is required.";
    if (!contact.phone.trim()) contactErrors.phone = "Phone number is required.";
    if (!contact.email.trim()) contactErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
      contactErrors.email = "Enter a valid email address.";

    if (Object.keys(contactErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...contactErrors }));
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const data = await submitEstimate({
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        answers,
      });
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const fieldErrors = {};
        for (const d of err.details) fieldErrors[d.field] = d.message;
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        setSubmitError("Please fix the highlighted fields and try again.");
      } else {
        setSubmitError(
          err instanceof ApiError
            ? err.message
            : "Couldn't submit your estimate. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartOver() {
    setStep(0);
    setAnswers({});
    setContact(initialContact);
    setErrors({});
    setResult(null);
    setSubmitError("");
  }

  const businessName = config?.business?.name;

  return (
    <div className="min-h-screen bg-fog">
      <header className="border-b border-slate/10 bg-fog/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <span className="font-display text-lg font-semibold text-ink">
            {businessName || "Roof Estimate"}
          </span>
          <Link
            to="/admin/login"
            className="text-xs font-medium text-slate-soft hover:text-ink"
          >
            Owner login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        {loadState === "loading" && <LoadingState />}

        {loadState === "error" && (
          <ErrorState message={loadError} onRetry={loadConfig} />
        )}

        {loadState === "ready" && !result && (
          <>
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                Get a real cost estimate
              </h1>
              <p className="mt-2 text-slate-soft">
                Answer a few questions about your roof and get a price range in
                minutes — no calls required.
              </p>
            </div>

            <ProgressSteps current={step} total={totalSteps} />

            <div className="card p-6 sm:p-8">
              {currentQuestion && (
                <QuestionField
                  question={currentQuestion}
                  value={answers[currentQuestion.key]}
                  onChange={(v) => handleAnswerChange(currentQuestion.key, v)}
                  error={errors[currentQuestion.key]}
                />
              )}

              {onContactStep && (
                <>
                  <h2 className="font-display text-xl font-semibold text-ink mb-1">
                    Almost done
                  </h2>
                  <p className="mb-5 text-sm text-slate-soft">
                    Where should we send your estimate?
                  </p>
                  <ContactForm
                    contact={contact}
                    onChange={setContact}
                    errors={errors}
                  />
                  {submitError && (
                    <p className="mt-4 rounded-md bg-brick-light px-3 py-2 text-sm text-brick-dark">
                      {submitError}
                    </p>
                  )}
                </>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="btn-quiet disabled:invisible"
                >
                  Back
                </button>

                {onContactStep ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? "Calculating…" : "Get my estimate"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextFromQuestion}
                    className="btn-primary"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {loadState === "ready" && result && (
          <EstimateResult
            estimate={{ ...result, currency }}
            business={config.business}
            contact={contact}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="card animate-pulse space-y-4 p-8">
      <div className="h-4 w-1/3 rounded bg-slate/10" />
      <div className="h-8 w-2/3 rounded bg-slate/10" />
      <div className="h-11 w-full rounded bg-slate/10" />
      <div className="h-11 w-full rounded bg-slate/10" />
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-display text-lg font-semibold text-ink">
        Couldn't load the estimator
      </p>
      <p className="mt-2 text-sm text-slate-soft">{message}</p>
      <button type="button" onClick={onRetry} className="btn-primary mt-5">
        Try again
      </button>
    </div>
  );
}
