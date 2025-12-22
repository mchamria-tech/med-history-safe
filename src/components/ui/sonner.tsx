import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive",
        },
      }}
      {...props}
    />
  );
};

// Custom toast functions with appropriate durations
const customToast = Object.assign(
  (message: string, options?: Parameters<typeof toast>[1]) => toast(message, { duration: 4000, ...options }),
  {
    success: (message: string, options?: Parameters<typeof toast.success>[1]) => 
      toast.success(message, { duration: 4000, ...options }),
    error: (message: string, options?: Parameters<typeof toast.error>[1]) => 
      toast.error(message, { duration: Infinity, ...options }),
    info: (message: string, options?: Parameters<typeof toast>[1]) => 
      toast.info(message, { duration: 4000, ...options }),
    warning: (message: string, options?: Parameters<typeof toast.warning>[1]) => 
      toast.warning(message, { duration: Infinity, ...options }),
    loading: toast.loading,
    dismiss: toast.dismiss,
    promise: toast.promise,
    custom: toast.custom,
  }
);

export { Toaster, customToast as toast };
