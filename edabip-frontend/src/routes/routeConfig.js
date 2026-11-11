import { createElement } from 'react';
import LandingPage from '../modules/landing-page/Landing-Page.jsx';
import ExplorePage from '../modules/explore-page/Explore-Page.jsx';
import LoginForm from '../modules/auth/components/LoginForm.jsx';
import SignupForm from '../modules/auth/components/SignupForm.jsx';
import ForgotPasswordForm from '../modules/auth/components/ForgotPasswordForm.jsx';
import CreateNewPasswordForm from'../modules/auth/components/CreateNewPasswordForm.jsx';
import PasswordResetSuccess from '../modules/auth/components/PasswordResetSuccess.jsx';
import SessionExpiredForm from '../modules/auth/components/SessionExpiredForm.jsx';
import OAuthCallback from '../modules/auth/components/OAuthCallback.jsx';
import DashboardPage from '../modules/dashboard/pages/DashboardPage.jsx';
import PowerBIPage from '../modules/powerbi/pages/PowerBIPage.jsx';
import OperationsAnalytics from '../modules/powerbi/components/OperationsAnalytics.jsx';
import SalesAnalytics from '../modules/powerbi/components/Sales-Analytics.jsx';
import FinancialAnalytics from '../modules/powerbi/components/FinancialAnalytics.jsx';
import CustomerAnalytics from '../modules/powerbi/components/CustomerAnalytics.jsx';
import TableauPage from '../modules/tableau/pages/TableauPage.jsx';
import BillingPage from '../modules/billing/pages/BillingPage.jsx';
import PaymentHistoryPage from '../modules/billing/pages/PaymentHistoryPage.jsx';
import AnalyticsPage from '../modules/analytics/pages/Analyticspage.jsx';
import AccountLockedForm from '../modules/auth/components/AccountLockedForm.jsx';
import ContactSupportForm from '../modules/auth/components/ContactSupportForm.jsx';
import StartFreeTrail from '../modules/start-free-trail/Start-Free-Trail.jsx';
import BookDemo from '../modules/book_demo-page/BookDemo.jsx';
import HRAnalytics from "../modules/powerbi/components/HRAnalytics.jsx";
import ReportsPage from "../modules/reports/pages/ReportsPage.jsx";
import UserManagementPage from "../modules/user-management/pages/UserManagementPage.jsx";
import SettingsPage from "../modules/settings/pages/SettingsPage.jsx";


export const routes = [
  {
    path: "/",
    element: createElement(LandingPage),
    protected: false,
  },
  {
    path: "/landing-page",
    element: createElement(LandingPage),
    protected: false,
  },
  {
    path: "/explore",
    element: createElement(ExplorePage),
    protected: false,
  },
  {
    path: "/login",
    element: createElement(LoginForm),
    guest: true,
  },
  {
    path: "/signup",
    element: createElement(SignupForm),
    guest: true,
  },
  {
    path: "/forgot-password",
    element: createElement(ForgotPasswordForm),
    protected: false,
  },
  {
    path: "/create-new-password",
    element: createElement(CreateNewPasswordForm),
    protected: false,
  },
  {
    path: "/reset-password",
    element: createElement(CreateNewPasswordForm),
    protected: false,
  },
  {
    path: "/password-reset-success",
    element: createElement(PasswordResetSuccess),
    protected: false,
  },
  {
    path: "/session-expired",
    element: createElement(SessionExpiredForm),
    protected: false,
  },
  {
    // Must stay public: the token is not stored yet when this mounts, so the
    // protected-route guard would bounce it to /login before it could run.
    path: "/oauth-callback",
    element: createElement(OAuthCallback),
    protected: false,
  },
  {
    path: "/dashboard",
    element: createElement(DashboardPage),
    protected: true,
  },
  {
    path: "/powerbi",
    element: createElement(PowerBIPage),
    protected: true,
  },
  {
    path: "/powerbi/sales-analytics",
    element: createElement(SalesAnalytics),
    protected: true,
  },
  {
    path: "/powerbi/report/operations",
    element: createElement(OperationsAnalytics),
    protected: true,
  },
  {
    path: "/powerbi/report/customer",
    element: createElement(CustomerAnalytics),
    protected: true,
  },
  {
  path: "/powerbi/report/hr",
  element: createElement(HRAnalytics),
  protected: true,
  },
  {
    path: "/powerbi/report/financial",
    element: createElement(FinancialAnalytics),
    protected: true,
  },
  {
    path: "/tableau",
    element: createElement(TableauPage),
    protected: true,
  },
  {
    path: "/analytics",
    element: createElement(AnalyticsPage),
    protected: true,
  },
  {
    path: "/reports",
    element: createElement(ReportsPage),
    protected: true,
  },
  {
    path: "/billing",
    element: createElement(BillingPage),
    protected: true,
  },
  {
    path: "/payment-history",
    element: createElement(PaymentHistoryPage),
    protected: true,
  },
  {
    path: "/users",
    element: createElement(UserManagementPage),
    protected: true,
  },
  {
    path: "/settings",
    element: createElement(SettingsPage),
    protected: true,
  },
  {
    path: "/account-locked",
    element: createElement(AccountLockedForm),
    protected: false,
  },
  {
    path: "/contact-support",
    element: createElement(ContactSupportForm),
    protected: false,
  },
  {
    path: "/book-demo",
    element: createElement(BookDemo),
    protected: true,
  },
  {
    path: "/start-free-trial",
    element: createElement(StartFreeTrail),
    protected: false,
  },
];
