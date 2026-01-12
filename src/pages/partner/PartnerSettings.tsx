import { useState, useEffect } from "react";
import { Building2, Mail, Phone, MapPin, Shield, Bell, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const PartnerSettings = () => {
  const { partner } = usePartnerCheck();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    gstNumber: "",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    criticalAlerts: true,
    weeklyReports: true,
    memberUpdates: false,
  });

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name || "",
        email: partner.email || "",
        address: partner.address || "",
        gstNumber: partner.gst_number || "",
      });
    }
  }, [partner]);

  const handleSave = () => {
    // In production, this would save to the database
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  return (
    <PartnerLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your partner account settings and preferences.
          </p>
        </div>

        {/* Partner Profile Section */}
        <div className="bg-card rounded-xl p-6 shadow-soft border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Partner Profile</h3>
              <p className="text-sm text-muted-foreground">
                Your organization information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter contact email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="Enter GST number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerCode">Partner Code</Label>
              <Input
                id="partnerCode"
                value={partner?.partner_code || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-card rounded-xl p-6 shadow-soft border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Control how you receive updates
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Email Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for important updates
                </p>
              </div>
              <Switch
                checked={notifications.emailAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, emailAlerts: checked })
                }
              />
            </div>
            <Separator />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Critical Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Immediate notifications for critical member health events
                </p>
              </div>
              <Switch
                checked={notifications.criticalAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, criticalAlerts: checked })
                }
              />
            </div>
            <Separator />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">
                  Receive weekly summary reports via email
                </p>
              </div>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, weeklyReports: checked })
                }
              />
            </div>
            <Separator />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Member Updates</p>
                <p className="text-sm text-muted-foreground">
                  Notifications when members upload new documents
                </p>
              </div>
              <Switch
                checked={notifications.memberUpdates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, memberUpdates: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-card rounded-xl p-6 shadow-soft border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Account Security</h3>
              <p className="text-sm text-muted-foreground">
                Manage your account security settings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
            <Separator />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerSettings;
