import { Link } from 'react-router-dom'
import PaymentButton from '../components/PaymentButton'

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2">About Pridocs</h1>
      <p className="text-lg text-slate-600 mb-10">Technology That Empowers, Privacy That Restores</p>
      
      <div className="prose prose-slate max-w-none text-slate-600 space-y-5">
        <p>
          At Pridocs, we believe technology should return control to its users. Every day, millions of people 
          upload private files to remote servers just to complete simple tasks like converting a PDF or editing 
          an image. We choose a different default.
        </p>
        
        <p>
          By leveraging cutting-edge browser technologies like WebAssembly and Web Workers, Pridocs processes 
          your files directly on your device. Your sensitive files never touch our servers, never leave your 
          sight, and never become someone else's data.
        </p>
        
        <p>
          We offer an extensive suite of generous, 100% free document and media conversion tools with zero 
          advertising. Pridocs is completely ad-free and tracking-free because we run entirely on the voluntary 
          support and donations of our global community of patrons.
        </p>

        <h2 className="text-xl font-semibold text-slate-800 mt-10 mb-4">Our Core Philosophy</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900">1. You Own Your Data</h3>
            <p>
              Privacy isn’t the absence of the cloud; it is the presence of control. Pridocs exists to help you 
              transform, organize, and secure your media—not to look at it, store it, or monetize it. Local-first 
              processing is our technical and moral baseline.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900">2. Zero Friction, Absolute Simplicity</h3>
            <p>
              We absorb the technical complexity so you don't have to. You will find no forced account sign-ups, 
              no endless onboarding flows, and no distracting dashboards here. Open a tool, convert your file in 
              seconds, and go about your day.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900">3. Trust Over Profit</h3>
            <p>
              Trust is the most valuable asset we will ever own. By eliminating massive server overhead through 
              local-first computing, we keep our operational costs remarkably low. This technical efficiency allows 
              us to prioritize generosity over restrictions and people over profit.
            </p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-slate-800 mt-10 mb-4">Help Keep Pridocs Free and Ad-Free</h2>
        
        <p>
          Pridocs is built for the public good. We do not sell your data, and we refuse to clutter your workspace 
          with annoying advertisements. If our tools saved you time and protected your privacy today, please 
          consider supporting our mission.
        </p>
        
        <div className="my-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <p className="text-sm font-medium text-slate-700 mb-3">Support Pridocs / Buy Us a Coffee</p>
          <PaymentButton />
        </div>

        <p>
          You can also spread the word by sharing our private tools with your colleagues, friends, and family.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-6 text-sm">
        <Link to="/" className="text-indigo-600 hover:underline">← Home</Link>
        <Link to="/how-it-works" className="text-indigo-600 hover:underline">How it Works</Link>
        <Link to="/privacy-pledge" className="text-indigo-600 hover:underline">Privacy Pledge</Link>
        <Link to="/all-tools" className="text-indigo-600 hover:underline">All Tools</Link>
        <Link to="/contact" className="text-indigo-600 hover:underline">Contact Us</Link>
      </div>
    </div>
  )
}
