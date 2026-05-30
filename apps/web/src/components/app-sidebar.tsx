// components/app-sidebar.tsx

import { Icons } from "@clinic-app/ui/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@clinic-app/ui/components/sidebar";
import {
  RiBarChartLine,
  RiCalendarLine,
  RiClipboardLine,
  RiDashboardLine,
  RiDatabase2Line,
  RiHealthBookLine,
  RiHeartPulseLine,
  RiHospitalLine,
  RiLogoutBoxLine,
  RiMailLine,
  RiMedicineBottleLine,
  RiNotificationLine,
  RiPhoneLine,
  RiQuestionLine,
  RiScalesLine,
  RiSettingsLine,
  RiSyringeLine,
  RiUserHeartLine,
  RiVirusLine,
} from "@remixicon/react";
import type * as React from "react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

// Mock data - replace with actual user data from your auth system
const data = {
  user: {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@pediatricclinic.com",
    avatar: "/avatars/doctor.jpg",
    role: "Pediatrician",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <RiDashboardLine />,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Today's Schedule",
          url: "/dashboard/schedule",
        },
        {
          title: "Recent Activity",
          url: "/dashboard/activity",
        },
      ],
    },
    {
      title: "Patients",
      url: "/patients",
      icon: <RiUserHeartLine />,
      items: [
        {
          title: "All Patients",
          url: "/patients",
        },
        {
          title: "Active Patients",
          url: "/patients/active",
        },
        {
          title: "New Patients",
          url: "/patients/new",
        },
        {
          title: "Growth Tracking",
          url: "/patients/growth",
        },
      ],
    },
    {
      title: "Appointments",
      url: "/appointments",
      icon: <RiCalendarLine />,
      items: [
        {
          title: "Schedule",
          url: "/appointments",
        },
        {
          title: "Check-ins",
          url: "/appointments/check-in",
        },
        {
          title: "Telehealth",
          url: "/appointments/telehealth",
        },
        {
          title: "Waitlist",
          url: "/appointments/waitlist",
        },
      ],
    },
    {
      title: "Medical Records",
      url: "/medical-records",
      icon: <RiClipboardLine />,
      items: [
        {
          title: "Health Records",
          url: "/medical-records",
        },
        {
          title: "Immunizations",
          url: "/medical-records/immunizations",
        },
        {
          title: "Growth Charts",
          url: "/medical-records/growth",
        },
        {
          title: "Developmental Milestones",
          url: "/medical-records/milestones",
        },
        {
          title: "Lab Results",
          url: "/medical-records/labs",
        },
      ],
    },
    {
      title: "Prescriptions",
      url: "/prescriptions",
      icon: <RiMedicineBottleLine />,
      items: [
        {
          title: "Active Prescriptions",
          url: "/prescriptions",
        },
        {
          title: "Refill Requests",
          url: "/prescriptions/refills",
        },
        {
          title: "Medication History",
          url: "/prescriptions/history",
        },
        {
          title: "Drug Interactions",
          url: "/prescriptions/interactions",
        },
      ],
    },
    {
      title: "Vaccinations",
      url: "/vaccinations",
      icon: <RiSyringeLine />,
      items: [
        {
          title: "Vaccination Schedule",
          url: "/vaccinations/schedule",
        },
        {
          title: "Record Vaccination",
          url: "/vaccinations/record",
        },
        {
          title: "Due Vaccinations",
          url: "/vaccinations/due",
        },
        {
          title: "Vaccine Inventory",
          url: "/vaccinations/inventory",
        },
      ],
    },
    {
      title: "Vitals & Growth",
      url: "/vitals",
      icon: <RiHeartPulseLine />,
      items: [
        {
          title: "Record Vitals",
          url: "/vitals/record",
        },
        {
          title: "Growth Charts",
          url: "/vitals/growth",
        },
        {
          title: "WHO Standards",
          url: "/vitals/who-standards",
        },
        {
          title: "Developmental Screening",
          url: "/vitals/screening",
        },
      ],
    },
    {
      title: "Clinical Analytics",
      url: "/analytics",
      icon: <RiBarChartLine />,
      items: [
        {
          title: "Patient Analytics",
          url: "/analytics/patients",
        },
        {
          title: "Clinical Outcomes",
          url: "/analytics/outcomes",
        },
        {
          title: "Immunization Rates",
          url: "/analytics/immunizations",
        },
        {
          title: "Growth Trends",
          url: "/analytics/growth",
        },
      ],
    },
  ],
  navClinical: [
    {
      title: "Growth Charts",
      icon: <RiScalesLine />,
      url: "/clinical/growth",
      items: [
        {
          title: "WHO Growth Standards",
          url: "/clinical/growth/who",
        },
        {
          title: "Percentile Calculator",
          url: "/clinical/growth/calculator",
        },
        {
          title: "Growth Predictor",
          url: "/clinical/growth/predictor",
        },
      ],
    },
    {
      title: "Developmental Screening",
      icon: <Icons.baby />,
      url: "/clinical/development",
      items: [
        {
          title: "ASQ Screening",
          url: "/clinical/development/asq",
        },
        {
          title: "M-CHAT",
          url: "/clinical/development/mchat",
        },
        {
          title: "Developmental Milestones",
          url: "/clinical/development/milestones",
        },
      ],
    },
    {
      title: "Disease Management",
      icon: <RiVirusLine />,
      url: "/clinical/diseases",
      items: [
        {
          title: "Common Conditions",
          url: "/clinical/diseases/common",
        },
        {
          title: "Chronic Conditions",
          url: "/clinical/diseases/chronic",
        },
        {
          title: "Care Plans",
          url: "/clinical/diseases/care-plans",
        },
      ],
    },
  ],
  navResources: [
    {
      title: "Clinical Guidelines",
      icon: <RiHealthBookLine />,
      url: "/resources/guidelines",
      items: [
        {
          title: "AAP Guidelines",
          url: "/resources/guidelines/aap",
        },
        {
          title: "CDC Recommendations",
          url: "/resources/guidelines/cdc",
        },
        {
          title: "Local Protocols",
          url: "/resources/guidelines/local",
        },
      ],
    },
    {
      title: "Drug Formulary",
      icon: <RiMedicineBottleLine />,
      url: "/resources/drugs",
      items: [
        {
          title: "Pediatric Dosing",
          url: "/resources/drugs/dosing",
        },
        {
          title: "Drug Interactions",
          url: "/resources/drugs/interactions",
        },
        {
          title: "Formulary List",
          url: "/resources/drugs/formulary",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: <RiSettingsLine />,
      items: [
        {
          title: "Clinic Settings",
          url: "/settings/clinic",
        },
        {
          title: "User Preferences",
          url: "/settings/preferences",
        },
        {
          title: "Notifications",
          url: "/settings/notifications",
        },
      ],
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: <RiQuestionLine />,
      items: [
        {
          title: "Documentation",
          url: "/help/docs",
        },
        {
          title: "Training Videos",
          url: "/help/training",
        },
        {
          title: "Support",
          url: "/help/support",
        },
      ],
    },
  ],
  quickAccess: [
    {
      name: "Recent Patients",
      url: "/quick/patients",
      icon: <RiUserHeartLine />,
    },
    {
      name: "Today's Schedule",
      url: "/quick/schedule",
      icon: <RiCalendarLine />,
    },
    {
      name: "Due Vaccinations",
      url: "/quick/vaccinations",
      icon: <RiSyringeLine />,
    },
    {
      name: "Lab Results",
      url: "/quick/labs",
      icon: <RiDatabase2Line />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <RiHospitalLine className="size-5!" />
                <span className="font-semibold text-base">
                  Pediatric Care Clinic
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <NavMain items={data.navMain} />

        {/* Clinical Tools Section */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 font-semibold text-muted-foreground text-xs tracking-tight">
            Clinical Tools
          </h2>
          <NavMain items={data.navClinical} />
        </div>

        {/* Resources Section */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 font-semibold text-muted-foreground text-xs tracking-tight">
            Resources
          </h2>
          <NavMain items={data.navResources} />
        </div>

        {/* Quick Access */}
        <NavDocuments items={data.quickAccess} />

        {/* Secondary Navigation */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />

        {/* Quick Actions Footer */}
        <div className="mt-2 flex items-center justify-between px-3 py-2">
          <button
            type="button"
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Notifications"
          >
            <RiNotificationLine className="size-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Messages"
          >
            <RiMailLine className="size-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Phone"
          >
            <RiPhoneLine className="size-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Logout"
            onClick={() => {
              // Add logout logic here
              console.log("Logout clicked");
            }}
          >
            <RiLogoutBoxLine className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
