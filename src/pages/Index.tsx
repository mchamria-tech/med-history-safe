import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PaginationDots from "@/components/PaginationDots";
import careBagLogo from "@/assets/carebag-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="w-full bg-primary py-8 text-center">
        <h1 className="text-4xl font-bold text-primary-foreground">Welcome!</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-between px-6 pb-6 pt-12">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center space-y-8">
          <div className="w-64 max-w-sm md:w-80">
            <img
              src={careBagLogo}
              alt="CareBag Logo"
              className="h-auto w-full drop-shadow-lg"
            />
          </div>

          <p className="max-w-md text-center text-xl font-medium text-foreground">
            CareBag allows you to store all your medical records in one place
          </p>

          {/* Pagination Dots */}
          <PaginationDots total={4} current={0} className="pt-4" />
        </div>

        {/* Action Buttons */}
        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("/login")}
            className="h-14 text-lg font-semibold"
          >
            LOG IN
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={() => navigate("/register")}
            className="h-14 bg-accent text-lg font-semibold text-accent-foreground hover:bg-accent/90"
          >
            REGISTER
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
