import { format } from 'date-fns'
import { Download, Trash2 } from 'lucide-react'
import React from 'react'
import { formatINR } from '../../utils/currency'
import { Link } from 'react-router-dom'

const PayslipList = ({payslips, isAdmin, onDelete}) => {
  return (
    <div className='card overflow-hidden'>
        <div className="overflow-x-auto">
            <table className="table-modern">
                <thead>
                    <tr>
                        {isAdmin && <th>Employee</th>}
                        <th>Period</th>
                        <th>Basic Salary</th>
                        <th>Net Salary</th>
                        <th className='text-center'>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {payslips.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-slate-400">
                                No payslips found
                            </td>
                        </tr>
                    ) : (
                        payslips.map((payslip)=>{
                            return (
                                <tr key={payslip._id || payslip.id}>
                                    {isAdmin && (
                                        <td className='text-slate-900'>
                                        {payslip.employee?.firstName} {payslip.employee?.lastName}
                                    </td>
                                    )}

                                    <td className='text-slate-500'>
                                        {format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")}
                                    </td>

                                    <td className='text-slate-500'>
                                        {formatINR(payslip.basicSalary)}
                                    </td>

                                    <td className='font-medium text-slate-800'>
                                        {formatINR(payslip.netSalary)}
                                    </td>

                                    <td className='text-center'>
                                       <div className='flex items-center justify-center gap-2'>
                                            <Link
                                            to={`/print/payslips/${payslip._id || payslip.id}`}
                                            className='inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors ring-1 ring-blue-600/10'>
                                                <Download className="w-3 h-3 mr-1.5" /> View / Download
                                            </Link>
                                            {isAdmin && (
                                                <button
                                                    onClick={()=> onDelete?.(payslip)}
                                                    className='inline-flex items-center justify-center p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors'
                                                    title="Delete payslip"
                                                >
                                                    <Trash2 className='w-4 h-4' />
                                                </button>
                                            )}
                                       </div>
                                    </td>

                                   
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
        </div>
  )
}

export default PayslipList
