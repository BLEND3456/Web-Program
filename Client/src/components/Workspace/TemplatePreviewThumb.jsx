const TemplatePreviewThumb = ({ src, loading }) => {
  if (loading && !src) {
    return <div className="shrink-0 w-11 h-[3.35rem] rounded-lg bg-app-elevated animate-pulse ring-1 ring-app-border" />;
  }

  if (!src) {
    return (
      <div className="shrink-0 w-11 h-[3.35rem] rounded-lg bg-app-elevated ring-1 ring-app-border flex items-center justify-center text-[8px] text-app-muted">
        —
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="shrink-0 w-11 h-[3.35rem] rounded-lg ring-1 ring-app-border bg-white object-cover object-top"
    />
  );
};

export default TemplatePreviewThumb;
