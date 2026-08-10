import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="min-w-0 flex-1 pt-[122px] xl:pt-[156px]">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
