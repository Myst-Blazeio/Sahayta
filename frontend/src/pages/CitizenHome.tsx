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
  },
  {
    name: "Ambulance",
    number: "102",
    description: "For medical emergencies & hospital transport",
    icon: Ambulance,
  },
  {
    name: "Women's Helpline",
    number: "181",
    description: "24/7 support for women in distress",
    icon: ShieldAlert,
  },
  {
    name: "Cybercrime Helpline",
    number: "1930",
    description: "Report online fraud, hacking & cyber threats",
    icon: Monitor,
  },
  {
    name: "National Helpline",
    number: "112",
    description: "Unified national emergency helpline for all services",
    icon: Phone,
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

interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  number: string;
  description: string;
}

const ContactCard: React.FC<ContactCardProps> = ({ icon, title, number, description }) => (
  <div className="bg-white p-6 border border-red-100 rounded hover:border-red-300 hover:shadow-md transition cursor-default text-center">
    <div className="mb-4 bg-red-50 inline-block p-3 rounded-full border border-red-100">
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-1 text-gray-900">{title}</h3>
    <p className="text-2xl font-bold text-red-600 mb-2">{number}</p>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default CitizenHome;
