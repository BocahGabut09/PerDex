"use client";
import { DiscussionEmbed } from "disqus-react";
import siteMetadata from "@/lib/seo/siteMetadata";
const Disqus = ({
  shortname,
  chapter_id,
  title,
}: {
  shortname: string;
  chapter_id: string;
  title: string;
}) => {
  return (
    <DiscussionEmbed
      shortname={`${process.env.NEXT_PUBLIC_DISQUS_SHORTNAME}`}
      config={{
        url: `${(process.env.NEXT_PUBLIC_DOMAIN || siteMetadata.siteUrl).replace(/\/+$/, "")}/baca-chapter/${encodeURIComponent(chapter_id)}`,
        identifier: `chapter/${chapter_id}`,
        title: `${title}`,
        language: "id-ID",
      }}
    />
  );
};

export default Disqus;