import { getDocumentViewerUrl } from "../utils/references";

function Footer(){

const itPolicyUrl = getDocumentViewerUrl(
"/resources/policies/IIT_Kharagpur_IT_Security_Policy.pdf",
"IT Policy Document",
)

return(

<footer className="bg-blue-950 text-white py-10">

<div className="max-w-6xl mx-auto grid gap-8 px-4 md:grid-cols-3">

<div>

<h3 className="font-semibold mb-3">
Quick Links
</h3>

<ul className="text-sm text-gray-300 space-y-1">

<li>
<a
href={itPolicyUrl}
target="_blank"
rel="noreferrer"
className="transition hover:text-cyan-200"
>
IT Security Policy
</a>
</li>
<li>
<a
href="/forms-downloads"
target="_blank"
rel="noreferrer"
className="transition hover:text-cyan-200"
>
Forms & Downloads
</a>
</li>
<li>
<a
href="http://swrepo.iitkgp.ac.in/"
target="_blank"
rel="noreferrer"
className="transition hover:text-cyan-200"
>
Software Repository
</a>
</li>
<li>
<a
href="/check-my-ip"
target="_blank"
rel="noreferrer"
className="transition hover:text-cyan-200"
>
Check My IP
</a>
</li>
<li>
<a
href="https://hpc.iitkgp.ac.in/"
target="_blank"
rel="noreferrer"
className="transition hover:text-cyan-200"
>
Paramshakti HPC
</a>
</li>

</ul>

</div>

<div>

<h3 className="font-semibold mb-3 uppercase tracking-[0.16em]">
Tenders
</h3>

<ul className="text-sm text-gray-300 space-y-1">
<li>
<a
href="/tenders"
className="transition hover:text-cyan-200"
>
CIC Tenders
</a>
</li>
</ul>

</div>

<div>

<h3 className="font-semibold mb-3">
Contact
</h3>

<div className="space-y-3 text-sm text-gray-300">

<p>
<strong className="font-semibold text-white">
For reporting problems/complaints about CIC services or for making any service request:
</strong>
</p>

<p>
Helpdesk, Computer and Informatics Centre
</p>

<p>
Email: helpdesk[at]cc.iitkgp.ac.in
</p>

<p>
Ph: (91)-3222-282391
</p>

</div>

</div>

</div>

</footer>

)

}

export default Footer
