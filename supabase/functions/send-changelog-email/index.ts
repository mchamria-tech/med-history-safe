import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Sending changelog email to samvit@hotmail.com");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CareBag <onboarding@resend.dev>",
        to: ["samvit@hotmail.com"],
        subject: "CareBag App - Recent Updates & Changes",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content {
                padding: 40px 30px;
              }
              .intro {
                font-size: 16px;
                margin-bottom: 30px;
                color: #555;
              }
              .changelog {
                margin-top: 20px;
              }
              .change-item {
                background-color: #f9fafb;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 4px;
              }
              .change-item h3 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 18px;
                font-weight: 600;
              }
              .change-item p {
                margin: 8px 0;
                color: #555;
                font-size: 14px;
              }
              .change-item .details {
                margin-top: 12px;
                padding-left: 15px;
                border-left: 2px solid #e5e7eb;
                color: #666;
                font-size: 13px;
              }
              .footer {
                background-color: #f9fafb;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #999;
              }
              .date-badge {
                display: inline-block;
                background-color: #667eea;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔄 CareBag Recent Updates</h1>
              </div>
              
              <div class="content">
                <p class="intro">
                  Hi Samvit,<br><br>
                  Here's a comprehensive changelog of the recent updates and improvements made to the CareBag application over the last 3 days.
                </p>
                
                <div class="date-badge">Last 3 Days of Changes</div>
                
                <div class="changelog">
                  <div class="change-item">
                    <h3>✅ Fixed Document 404 Errors</h3>
                    <p><strong>Impact:</strong> Critical bug fix for document viewing</p>
                    <div class="details">
                      <p><strong>Problem:</strong> Documents were returning 404 errors when users tried to view them because the old URL format was no longer compatible with Supabase storage.</p>
                      <p><strong>Solution:</strong> Updated the <code>getDocumentUrl</code> function in ViewDocuments.tsx to use the proper public URL format. Now correctly handles both legacy and new storage URL formats.</p>
                      <p><strong>Files Modified:</strong> src/pages/ViewDocuments.tsx</p>
                      <p><strong>Result:</strong> Users can now successfully view, download, and print their documents without errors.</p>
                    </div>
                  </div>

                  <div class="change-item">
                    <h3>🎨 Improved Document Management UI</h3>
                    <p><strong>Impact:</strong> Enhanced user experience and cleaner interface</p>
                    <div class="details">
                      <p><strong>Change:</strong> Replaced individual action icons (View, Download, Print, Share, Delete) with a consolidated three-dot dropdown menu.</p>
                      <p><strong>Benefit:</strong> More professional and cleaner interface that reduces visual clutter while maintaining full functionality.</p>
                      <p><strong>Implementation:</strong> Used Radix UI DropdownMenu component for consistent design patterns.</p>
                      <p><strong>Files Modified:</strong> src/pages/ViewDocuments.tsx</p>
                      <p><strong>Features:</strong> All actions (View, Download, Print, Share, Delete) are now accessible through a single intuitive dropdown menu on each document card.</p>
                    </div>
                  </div>

                  <div class="change-item">
                    <h3>🔧 Restyled Dashboard Logout Button</h3>
                    <p><strong>Impact:</strong> Improved visual consistency and design aesthetics</p>
                    <div class="details">
                      <p><strong>Previous Style:</strong> Black outline button with white text on black background</p>
                      <p><strong>New Style:</strong> Minimal ghost variant with black text and icon, transparent background with subtle hover effect</p>
                      <p><strong>Rationale:</strong> Provides a cleaner, less intrusive appearance that better integrates with the dashboard design.</p>
                      <p><strong>Files Modified:</strong> src/pages/Profiles_Main.tsx</p>
                      <p><strong>Technical Details:</strong> Changed from <code>variant="outline"</code> to <code>variant="ghost"</code> with updated color scheme for better visual harmony.</p>
                    </div>
                  </div>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
                  All changes have been tested and are now live in production. If you have any questions or need further details about any of these updates, feel free to reach out.
                </p>
              </div>
              
              <div class="footer">
                <p>© 2025 CareBag. All rights reserved.</p>
                <p>This is an automated update notification.</p>
              </div>
            </div>
          </body>
        </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Changelog email sent successfully to samvit@hotmail.com",
        emailId: data 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending changelog email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
