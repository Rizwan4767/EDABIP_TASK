import { useNavigate, useLocation } from "react-router-dom";
import "./AnalyticsTabs.css";

const TAB_ROUTES = {
  "Sales Analytics": "/powerbi/sales-analytics",
  "Financial Analytics": "/powerbi/report/financial",
  "Customer Analytics": "/powerbi/report/customer",
  "HR Analytics": "/powerbi/report/hr",
  "Operations Analytics": "/powerbi/report/operations",
};

const TABS = Object.keys(TAB_ROUTES);

export default function AnalyticsTabs({ as = "nav", ariaLabel = "Analytics categories" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = TABS.find((tab) => TAB_ROUTES[tab] === location.pathname);
  const Wrapper = as;

  return (
    <Wrapper className="at-tabs" aria-label={as === "nav" ? ariaLabel : undefined}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            className={`at-tab${isActive ? " at-tab--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => navigate(TAB_ROUTES[tab])}
          >
            {tab}
          </button>
        );
      })}
    </Wrapper>
  );
}