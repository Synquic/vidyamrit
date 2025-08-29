type ScrollProps = {
  direction?: "up" | "down";
  msg?: string;
};

export default function Scroll({
  direction = "down",
  msg = "Back to Top",
}: ScrollProps) {
  const iconAnimation =
    direction === "up"
      ? "group-hover:-translate-y-[200%]"
      : "group-hover:translate-y-[200%]";

  return (
    <div className="flex items-center justify-center">
      <button
        className="
          group
          w-[50px] h-[50px] rounded-full
          bg-gradient-to-b from-purple-200 to-pink-100
          border-none font-semibold flex items-center justify-center
          shadow-[0_0_0_4px_rgba(180,160,255,0.25)]
          cursor-pointer transition-all duration-300 overflow-hidden relative
          hover:w-[140px] hover:rounded-[50px] hover:bg-[#7a18e5]
        "
      >
        <span
          className="
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            text-[#7a18e5] text-[0px] pointer-events-none transition-all duration-300
            group-hover:text-[13px] group-hover:opacity-100
          "
        >
          {msg}
        </span>
        <svg
          viewBox="0 0 384 512"
          className={`svgIcon w-[12px] transition-transform duration-300 ${iconAnimation}`}
          style={direction === "down" ? { transform: "rotate(180deg)" } : {}}
          fill="none"
        >
          <path
            d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"
            fill="#7a18e5"
          />
        </svg>
      </button>
    </div>
  );
}
