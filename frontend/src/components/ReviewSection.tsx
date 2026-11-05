import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reviewsApi } from '../api/client';
import { Star, ThumbsUp, ThumbsDown, Send, Trash2 } from 'lucide-react';

interface Review {
  id: number;
  institute_id: string;
  user_id: number;
  user_name: string;
  user_avatar: string;
  rating_overall: number;
  rating_teaching: number;
  rating_facilities: number;
  rating_treatment: number;
  rating_environment: number;
  rating_value: number;
  title: string;
  body: string;
  is_anonymous: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            size={readonly ? 14 : 20}
            className={(hover || value) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, token, onVote, onDelete }: { review: Review; token: string | null; onVote: (id: number, vote: number) => void; onDelete: (id: number) => void }) {
  const { user } = useAuth();
  void token;
  const isOwner = user && user.id === review.user_id;

  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shrink-0">
          {review.is_anonymous ? '?' : (review.user_name?.[0] || 'U').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[var(--color-text)] text-sm">
              {review.is_anonymous ? 'Anonymous' : review.user_name || 'User'}
            </span>
            <StarRating value={review.rating_overall} readonly />
            <span className="text-xs text-[var(--color-muted)]">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          {review.title && <h4 className="font-semibold text-[var(--color-text)] mt-1 text-sm">{review.title}</h4>}
          <p className="text-sm text-[var(--color-muted)] mt-1 leading-relaxed">{review.body}</p>

          {/* Category ratings */}
          {(review.rating_teaching || review.rating_facilities || review.rating_treatment) && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {review.rating_teaching && <div className="flex items-center gap-1"><span className="text-[var(--color-muted)]">Teaching:</span> <StarRating value={review.rating_teaching} readonly /></div>}
              {review.rating_facilities && <div className="flex items-center gap-1"><span className="text-[var(--color-muted)]">Facilities:</span> <StarRating value={review.rating_facilities} readonly /></div>}
              {review.rating_treatment && <div className="flex items-center gap-1"><span className="text-[var(--color-muted)]">Treatment:</span> <StarRating value={review.rating_treatment} readonly /></div>}
              {review.rating_environment && <div className="flex items-center gap-1"><span className="text-[var(--color-muted)]">Environment:</span> <StarRating value={review.rating_environment} readonly /></div>}
              {review.rating_value && <div className="flex items-center gap-1"><span className="text-[var(--color-muted)]">Value:</span> <StarRating value={review.rating_value} readonly /></div>}
            </div>
          )}

          {/* Vote buttons */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => onVote(review.id, 1)}
              className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-emerald-600 transition"
            >
              <ThumbsUp size={12} /> {review.helpful_count || 0}
            </button>
            <button
              onClick={() => onVote(review.id, -1)}
              className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-red-500 transition"
            >
              <ThumbsDown size={12} /> {review.not_helpful_count || 0}
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(review.id)}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition ml-auto"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReviewSection({ eiin }: { eiin: string }) {
  const { token, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userLiked, setUserLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingTeaching, setRatingTeaching] = useState(0);
  const [ratingFacilities, setRatingFacilities] = useState(0);
  const [ratingTreatment, setRatingTreatment] = useState(0);
  const [ratingEnvironment, setRatingEnvironment] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const loadReviews = () => {
    setLoading(true);
    reviewsApi.get(eiin, token || undefined)
      .then((r) => {
        setReviews(r.data.reviews || []);
        setSummary(r.data.summary || {});
        setUserLiked(r.data.user_liked || false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Get like count from institute detail
  };

  useEffect(() => { loadReviews(); }, [eiin, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || ratingOverall === 0 || !body.trim()) return;
    setSubmitting(true);
    try {
      await reviewsApi.create(eiin, {
        rating_overall: ratingOverall,
        rating_teaching: ratingTeaching || null,
        rating_facilities: ratingFacilities || null,
        rating_treatment: ratingTreatment || null,
        rating_environment: ratingEnvironment || null,
        rating_value: ratingValue || null,
        title: title.trim(),
        body: body.trim(),
        is_anonymous: isAnonymous,
      }, token);
      setShowForm(false);
      resetForm();
      loadReviews();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRatingOverall(0); setRatingTeaching(0); setRatingFacilities(0);
    setRatingTreatment(0); setRatingEnvironment(0); setRatingValue(0);
    setTitle(''); setBody(''); setIsAnonymous(false);
  };

  const handleVote = async (reviewId: number, vote: number) => {
    if (!token) { alert('Please sign in to vote'); return; }
    try {
      await reviewsApi.vote(eiin, reviewId, { vote }, token);
      loadReviews();
    } catch {}
  };

  const handleDelete = async (reviewId: number) => {
    if (!token || !confirm('Delete this review?')) return;
    try {
      await reviewsApi.delete(eiin, reviewId, token);
      loadReviews();
    } catch {}
  };

  const handleLike = async () => {
    if (!token) { alert('Please sign in to like'); return; }
    try {
      const r = await reviewsApi.toggleLike(eiin, token);
      setUserLiked(r.data.liked);
      setLikeCount(r.data.like_count);
    } catch {}
  };

  const avgRating = summary.avg_overall ? Number(summary.avg_overall).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{avgRating || '—'}</div>
          <StarRating value={Math.round(Number(avgRating) || 0)} readonly />
          <p className="text-xs text-[var(--color-muted)] mt-1">{summary.total_reviews || 0} reviews</p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[
            { label: 'Teaching', val: summary.avg_teaching },
            { label: 'Facilities', val: summary.avg_facilities },
            { label: 'Treatment', val: summary.avg_treatment },
            { label: 'Environment', val: summary.avg_environment },
            { label: 'Value', val: summary.avg_value },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-[var(--color-muted)]">{label}</span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${((val || 0) / 5) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-[var(--color-muted)]">{val ? Number(val).toFixed(1) : '—'}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border transition ${userLiked ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800' : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-red-300'}`}
          >
            <Star size={16} className={userLiked ? 'fill-red-500 text-red-500' : ''} />
            <span className="text-sm">{userLiked ? 'Liked' : 'Like'} {likeCount > 0 && `(${likeCount})`}</span>
          </button>
          {isAuthenticated && !summary.user_reviewed && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition"
            >
              {showForm ? 'Cancel' : 'Write Review'}
            </button>
          )}
          {!isAuthenticated && (
            <a href="/login" className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition">
              Sign in to Review
            </a>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h3 className="font-semibold text-[var(--color-text)]">Write a Review</h3>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">Overall Rating *</label>
            <StarRating value={ratingOverall} onChange={setRatingOverall} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Teaching', val: ratingTeaching, set: setRatingTeaching },
              { label: 'Facilities', val: ratingFacilities, set: setRatingFacilities },
              { label: 'Treatment', val: ratingTreatment, set: setRatingTreatment },
              { label: 'Environment', val: ratingEnvironment, set: setRatingEnvironment },
              { label: 'Value', val: ratingValue, set: setRatingValue },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-xs text-[var(--color-muted)] mb-1 block">{label}</label>
                <StarRating value={val} onChange={set} />
              </div>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:border-emerald-500 outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience... (required)"
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:border-emerald-500 outline-none resize-none"
            required
          />
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
            Post anonymously
          </label>
          <button
            type="submit"
            disabled={submitting || ratingOverall === 0 || !body.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition disabled:opacity-50"
          >
            <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2 dark:bg-slate-700" />
              <div className="h-3 bg-slate-100 rounded w-full dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-muted)]">
          <Star size={32} className="mx-auto mb-2 opacity-30" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              token={token}
              onVote={handleVote}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}