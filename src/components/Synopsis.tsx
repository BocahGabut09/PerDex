"use client";
import { useState } from "react";
const Synopsis = ({ synopsis }: { synopsis: string }) => {
  const [showMore, setShowMore] = useState(false);
  const maxLength = 400;
  const toggleShowMore = () => {
    setShowMore(!showMore);
  };
  const renderSynopsis = () => {
    if (!synopsis) {
      return "";
    }
    if (synopsis.length <= maxLength) {
      return synopsis;
    }
    if (!showMore) {
      return `${synopsis.substring(0, maxLength)}...`;
    }
    return synopsis;
  };

  return (
    <p
      className="mt-5 text-slate-400 font-karla text-left w-full px-3 sm:px-0 sm:w-10/12"
      id="synopsis"
    >
      {renderSynopsis()}
      {synopsis && synopsis.length > maxLength && (
        <span
          className="text-violet-300 font-medium font-karla cursor-pointer"
          onClick={toggleShowMore}
        >
          {showMore ? "Show Less" : "Show More"}
        </span>
      )}
    </p>
  );
};

export default Synopsis;