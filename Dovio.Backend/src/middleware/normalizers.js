export const normalizeCreateOrUpdatePostPayload = (req, _res, next) => {
  try {
    const b = req.body || {};

    // Accept alternative casings/keys
    const mediaCandidates = b.mediaURLs ?? b.mediaUrls ?? b.mediaUrl ?? b.mediaURL;

    // Coerce mediaURLs into an array of strings
    let mediaURLs = mediaCandidates;
    if (typeof mediaURLs === 'string') {
      const s = mediaURLs.trim();
      if (s.startsWith('[') && s.endsWith(']')) {
        try { mediaURLs = JSON.parse(s); } catch { /* fallback below */ }
      }
      if (!Array.isArray(mediaURLs)) {
        mediaURLs = [s];
      }
    }
    if (Array.isArray(mediaURLs)) {
      mediaURLs = mediaURLs.map(v => (typeof v === 'string' ? v.trim() : v)).filter(Boolean);
    }

    // Normalize postText to string if provided
    let { postText } = b;
    if (postText != null && typeof postText !== 'string') {
      postText = String(postText);
    }

    // Normalize location if provided via separate fields
    let { location } = b;
    if (!location && (b.locationName || b.locationCoordinates)) {
      location = {
        name: b.locationName,
        coordinates: b.locationCoordinates
      };
    }

    req.body = {
      ...b,
      ...(postText !== undefined ? { postText } : {}),
      ...(mediaURLs !== undefined ? { mediaURLs } : {}),
      ...(location !== undefined ? { location } : {})
    };

    next();
  } catch (_e) {
    // On failure, proceed; Joi will handle any remaining issues
    next();
  }
};
