import { useEffect, useRef, useState } from 'react';
import {useParams} from 'react-router-dom'
import Loading from '../components/Loading';
import {format} from 'date-fns'
import api from '../api/axios';
import { formatINR } from '../utils/currency';
import { DownloadIcon, Loader2Icon, PrinterIcon } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/useAuth';
import { getLocalPayslipById, isLocalRecordId } from '../utils/localDemoData';

const PrintPayslip = () => {
  const {id} = useParams();
  const {user} = useAuth();
  const [payslip, setPayslip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const payslipRef = useRef(null)

  useEffect(()=>{
    if(isLocalRecordId(id)){
      setPayslip(getLocalPayslipById(id, user))
      setLoading(false)
      return;
    }

    api.get(`/payslips/${id}`)
      .then((res)=> setPayslip(res.data))
      .catch(()=>{
        setPayslip(getLocalPayslipById(id, user))
      })
      .finally(()=> setLoading(false))
  },[id, user])

  if(loading) return <Loading />
  if(!payslip) return <p className='text-center py-12 text-slate-400'>Payslip not found</p>

  const period = format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")
  const employeeName = `${payslip.employee?.firstName || "Employee"} ${payslip.employee?.lastName || ""}`.trim()
  const fileName = `payslip-${employeeName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-${period.replace(/\s+/g, "-").toLowerCase()}.pdf`

  const handleDownload = async () => {
    if(!payslipRef.current) return;
    setDownloading(true)
    try {
      await html2pdf()
        .set({
          margin: 10,
          filename: fileName,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(payslipRef.current)
        .save();
    } finally {
      setDownloading(false)
    }
  }

  return ( 
    <div className="max-w-2xl mx-auto animate-fade-in">
    <div ref={payslipRef} className="p-8 bg-white">
      <div className='text-center border-b border-slate-200 pb-6 mb-8'>
        <h1 className='text-2xl font-bold text-slate-900 tracking-tight'>PAYSLIP</h1>
        <p className='text-slate-500 text-sm mt-1'>{period}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className='text-xs text-slate-400 uppercase tracking-wider mb-1'>Employee Name</p>
          <p className='font-semibold text-slate-900'>{employeeName}</p>
        </div>
        <div>
          <p className='text-xs text-slate-400 uppercase tracking-wider mb-1'>Position</p>
          <p className='font-semibold text-slate-900'>{payslip.employee?.position}</p>
        </div>
        <div>
          <p className='text-xs text-slate-400 uppercase tracking-wider mb-1'>Email</p>
          <p className='font-semibold text-slate-900'>{payslip.employee?.email}</p>
        </div>
        <div>
          <p className='text-xs text-slate-400 uppercase tracking-wider mb-1'>Period</p>
          <p className='font-semibold text-slate-900'>{period}</p>
        </div>
      </div>
      <div className='rounded-xl border border-slate-200 overflow-hidden mb-8'>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className='text-left py-3 px-4 text-xs text-slate-500 uppercase tracking-wider'>Description</th>
            <th className='text-right py-3 px-4 text-xs text-slate-500 uppercase tracking-wider'>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            <td className='py-3 px-4 text-slate-700'>Basic Salary</td>
            <td className='text-right py-3 px-4 text-slate-900 font-medium'>{formatINR(payslip.basicSalary)}</td>
          </tr>
          <tr className="border-t border-slate-100">
            <td className='py-3 px-4 text-slate-700'>Allowances</td>
            <td className='text-right py-3 px-4 text-slate-900 font-medium'>{payslip.allowances ? `+${formatINR(payslip.allowances)}` : formatINR(0)}</td>
          </tr>
          <tr className="border-t border-slate-100">
            <td className='py-3 px-4 text-slate-700'>Deductions</td>
            <td className='text-right py-3 px-4 text-slate-900 font-medium'>{payslip.deductions ? `-${formatINR(payslip.deductions)}` : formatINR(0)}</td>
          </tr>
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td className='py-4 px-4 font-bold text-slate-900'>Net Salary</td>
            <td className='text-right py-4 px-4 font-bold text-slate-900 text-lg'>{formatINR(payslip.netSalary)}</td>
          </tr>
        </tbody>
      </table>
      </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 print:hidden">
        <button className="btn-primary inline-flex items-center gap-2" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
          Download PDF
        </button>
        <button className="btn-secondary inline-flex items-center gap-2" onClick={()=> window.print()}>
          <PrinterIcon className="w-4 h-4" />
          Print Payslip
        </button>
      </div>
    </div>
  )
}

export default PrintPayslip
