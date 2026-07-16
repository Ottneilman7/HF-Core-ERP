import { ReactNode } from "react";
import Sidebar from "../components/layout/Sidebar";
import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <div
      style={{
        display: "flex",
        background: colors.background,
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "32px",
        }}
      >
        {children}
      </main>
    </div>
  );
}