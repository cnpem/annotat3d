import { pageTree } from "../source";
import { DocsLayout } from "fumadocs-ui/layout";
import type { ReactNode } from "react";
import Image from "next/image";

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  const tree = pageTree as any; // or 'unknown'
  return (
    <DocsLayout
      tree={tree}
      nav={{
        title: (
          <>
            <div className="flex flex-row items-center">
            <span className="font-semibold text-lg text-center pt-1">
              <span className="text-black">Annotat</span>
              <span className="text-violet-600 dark:text-violet-400">3D</span>
            </span>
            </div>
          </>
        ),
        githubUrl: "https://github.com/cnpem/annotat3d",
        transparentMode: "top",
      }}
    >
      {children}
    </DocsLayout>
  );
}
