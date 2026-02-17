import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FileText, Search, Info, Phone, Shield, Ambulance, ShieldAlert, Monitor } from "lucide-react";

const emergencyContacts = [
  {
    name: "Police",
    number: "100",
    description: "For reporting crimes & law enforcement emergencies",
    icon: Shield,
    gradient: "from-blue-600 to-blue-800",
    bgLight: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    ringColor: "ring-blue-500",
  },
  {
    name: "Ambulance",
    number: "102",
    description: "For medical emergencies & hospital transport",
    icon: Ambulance,
    gradient: "from-red-500 to-red-700",
    bgLight: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    ringColor: "ring-red-500",
  },
  {
    name: "Women's Helpline",
    number: "181",
    description: "24/7 support for women in distress",
    icon: ShieldAlert,
    gradient: "from-purple-500 to-purple-700",
    bgLight: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    ringColor: "ring-purple-500",
  },
  {
    name: "Cybercrime Helpline",
    number: "1930",
    description: "Report online fraud, hacking & cyber threats",
    icon: Monitor,
    gradient: "from-emerald-500 to-emerald-700",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    ringColor: "ring-emerald-500",
  },
  {
    name: "National Helpline",
    number: "112",
    description: "Unified national emergency helpline for all services",
    icon: Phone,
    gradient: "from-gray-700 to-gray-900",
    bgLight: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
    ringColor: "ring-gray-500",
  },
];

const CitizenHome = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 select-none">
      <Navbar />

      {/* Official Header */}
      <header className="bg-white border-b border-gray-200 py-12 px-4 shadow-sm">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-blue-900 mb-4">
              Citizen Services Portal
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              Efficient, transparent, and accessible public grievance redressal
              system.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              to="/citizen/login"
              className="px-6 py-3 bg-primary text-white font-bold rounded hover:bg-primary/90 transition shadow-sm"
            >
              Login
            </Link>
            <Link
              to="/citizen/signup"
              className="px-6 py-3 bg-white border border-primary text-primary font-bold rounded hover:bg-gray-50 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 border-l-4 border-primary pl-4">
            Available Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ServiceCard
              icon={<FileText className="w-8 h-8 text-primary" />}
              title="File Online FIR"
              description="Register a First Information Report for non-heinous crimes securely online."
            />
            <ServiceCard
              icon={<Search className="w-8 h-8 text-primary" />}
              title="Track Application"
              description="Check the current status of your filed complaints or service requests."
            />
            <ServiceCard
              icon={<Info className="w-8 h-8 text-primary" />}
              title="Information Center"
              description="Guidelines, FAQs, and safety protocols for citizens."
            />
          </div>
        </div>
      </section>

      {/* Emergency Help & Contacts Section */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-100 rounded-lg">
              <Phone className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Emergency Help & Contacts
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Quick access to emergency services — available 24/7
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {emergencyContacts.map((contact) => {
              const IconComponent = contact.icon;
              return (
                <a
                  key={contact.number}
                  href={`tel:${contact.number}`}
                  className={`group relative overflow-hidden rounded-xl border ${contact.borderColor} ${contact.bgLight} p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.03] hover:ring-2 ${contact.ringColor} focus:outline-none focus:ring-2 ${contact.ringColor}`}
                >
                  {/* Gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${contact.gradient}`} />

                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${contact.gradient} shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-base ${contact.textColor}`}>
                        {contact.name}
                      </h3>
                      <p className={`text-2xl font-extrabold tracking-wide ${contact.textColor} mt-1`}>
                        {contact.number}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    {contact.description}
                  </p>


                </a>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description }) => (
  <div className="bg-white p-6 border border-gray-200 rounded hover:border-primary hover:shadow-md transition cursor-default">
    <div className="mb-4 bg-gray-50 inline-block p-3 rounded-full border border-gray-100">
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default CitizenHome;
