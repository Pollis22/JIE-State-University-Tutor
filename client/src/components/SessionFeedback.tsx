import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Star, Send, CheckCircle } from "lucide-react";

const UW_RED = "#C5050C";

interface Props {
  sessionId?: string | null;
  show: boolean;
}

export function SessionFeedback({ sessionId, show }: Props) {
  const [rating, setRating]         = useState(0);
  const [hovered, setHovered]       = useState(0);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    setError("");
    setSubmitting(true);
    try {
      await fetch("/api/session-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating, comment: comment.trim() }),
        credentials: "include",
      });
      setSubmitted(true);
    } catch {
      setError("Could not submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];
  const activeRating = hovered || rating;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full rounded-xl overflow-hidden"
          style={{
            border: `1px solid rgba(197,5,12,0.18)`,
            background: "linear-gradient(160deg, #fff8f8 0%, #fff 60%)",
            boxShadow: "0 2px 16px rgba(197,5,12,0.07)",
          }}
        >
          {/* Header bar */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ background: `linear-gradient(90deg, ${UW_RED} 0%, #9B0000 100%)` }}
          >
            <MessageSquare className="h-4 w-4 text-white/90" />
            <span className="text-white text-sm font-bold tracking-wide">
              How was your session?
            </span>
          </div>

          <div className="p-4">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="thanks"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2 py-3 text-center"
                >
                  <CheckCircle className="h-8 w-8" style={{ color: UW_RED }} />
                  <p className="font-bold text-sm" style={{ color: UW_RED }}>
                    Thank you! 🎓
                  </p>
                  <p className="text-xs text-gray-500">
                    Your feedback helps us improve the State University AI Tutor experience.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form" className="space-y-3">
                  {/* Star rating */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHovered(star)}
                          onMouseLeave={() => setHovered(0)}
                          className="transition-transform duration-100 hover:scale-110 focus:outline-none"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                        >
                          <Star
                            className="h-8 w-8 transition-colors duration-150"
                            style={{
                              fill:   star <= activeRating ? UW_RED : "transparent",
                              color:  star <= activeRating ? UW_RED : "#d1d5db",
                              filter: star <= activeRating ? "drop-shadow(0 0 3px rgba(197,5,12,0.4))" : "none",
                            }}
                          />
                        </button>
                      ))}
                    </div>
                    {activeRating > 0 && (
                      <span
                        className="text-xs font-semibold transition-all duration-200"
                        style={{ color: UW_RED }}
                      >
                        {LABELS[activeRating]}
                      </span>
                    )}
                  </div>

                  {/* Comment box */}
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Any comments? (optional) — What went well, what could be better..."
                    rows={3}
                    maxLength={500}
                    className="w-full text-sm rounded-lg border p-3 resize-none focus:outline-none transition-colors"
                    style={{
                      borderColor: "rgba(197,5,12,0.2)",
                      background: "white",
                      color: "#333",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = UW_RED)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(197,5,12,0.2)")}
                  />
                  {comment.length > 0 && (
                    <div className="text-right text-xs text-gray-400 -mt-2">
                      {comment.length}/500
                    </div>
                  )}

                  {error && (
                    <p className="text-xs font-medium" style={{ color: UW_RED }}>
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-60"
                    style={{ background: `linear-gradient(90deg, ${UW_RED} 0%, #9B0000 100%)` }}
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
