## My review before submitting

- Deployed the backend to Render and the frontend to Vercel myself,
  connecting a real MongoDB Atlas cluster rather than relying on the
  original sandbox verification.
- The estimator page showed an error saying it couldn't reach the
  server. I found that Render's CORS_ORIGINS setting only had the old
  preview URL listed, not the domain being tested — so the backend was
  rejecting requests from an origin it didn't recognize. Adding the
  missing URL to that list and letting it redeploy fixed it.
- Separately, while editing environment variables on Render, the
  ADMIN_USERNAME field ended up containing the CORS origins list
  instead of CORS_ORIGINS — caught during review before saving, so it
  never actually went live.
- Exporting the leads table to CSV surfaced an older lead using a
  different set of answer keys than current leads. Since this app is
  config-driven and questions can change over time, this is expected —
  confirmed by the older config_version value on that row rather than
  it being a data bug.