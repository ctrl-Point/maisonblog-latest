import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import Banner from './Banner';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/admin';
  console.log('isHomePage:', isHomePage);
console.log('isAdminPage:', isAdminPage);


  return (
    <main>
      <Header />
      {isHomePage && <Banner />}
      {isAdminPage && <Banner />}  {/* Render Banner on homepage or admin page */}
      <Outlet />
      <Footer />
    </main>
  );
}
