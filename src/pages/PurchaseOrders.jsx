import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import ModalShell from '../components/ModalShell'
import apiClient from '../utils/apiClient'
import { getAuthOrNull } from '../utils/auth'
import { ShoppingCart, Plus, Search, ChevronRight, Clock, CheckCircle2, AlertCircle, Send, XCircle, RefreshCw, Package } from 'lucide-react'

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  SUBMITTED_FOR_APPROVAL: { label: 'Pending Approval', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  SENT_TO_VENDOR: { label: 'Sent to Vendor', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  VENDOR_ACCEPTED: { label: 'Vendor Accepted', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  ACTIVE: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PARTIALLY_FULFILLED: { label: 'Partial Delivery', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  FULFILLED: { label: 'Fulfilled', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  REVISION_REQUIRED: { label: 'Revision Required', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  VENDOR_REJECTED: { label: 'Vendor Rejected', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-400 border-slate-200' },
}

function CreatePOModal({ onClose, onSaved }) {
  const [vendors, setVendors] = useState([])
  const [form, setForm] = useState({ vendorId: '', deliveryAddress: 'MSEC Campus, Aravayal, Chennai - 600089', deliveryLocation: '', expectedDeliveryDate: '', paymentTerms: 'Net 30', notes: '', deliveryCharge: 0 })
  const [items, setItems] = useState([{ description: '', specification: '', brand: '', quantityOrdered: 1, unit: 'pcs', unitPrice: 0, taxRate: 18, discount: 0 }])
  const [loading, setLoading] = useState(false)
  const { showSuccess, showError } = useAlert()

  useEffect(() => {
    apiClient.get('/api/vendors?status=ACTIVE').then(r => { if (r.success) setVendors(r.data) })
  }, [])

  const addItem = () => setItems(p => [...p, { description: '', specification: '', brand: '', quantityOrdered: 1, unit: 'pcs', unitPrice: 0, taxRate: 18, discount: 0 }])
  const removeItem = idx => setItems(p => p.filter((_, i) => i !== idx))
  const updateItem = (idx, field, val) => setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item))

  const calcTotal = () => {
    let sub = 0, tax = 0, disc = 0
    items.forEach(item => {
      const lineSub = Number(item.quantityOrdered) * Number(item.unitPrice)
      const lineDisc = Number(item.discount || 0)
      const lineTax = (lineSub - lineDisc) * (Number(item.taxRate) / 100)
      sub += lineSub; disc += lineDisc; tax += lineTax
    })
    return { subtotal: sub, taxTotal: tax, discountTotal: disc, grandTotal: sub - disc + tax + Number(form.deliveryCharge || 0) }
  }
  const totals = calcTotal()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vendorId || !items.some(i => i.description)) return showError('Missing Info', 'Select vendor and add at least one item')
    setLoading(true)
    try {
      const res = await apiClient.post('/api/purchase-orders', { ...form, items })
      if (res.success) { showSuccess('PO Created', `${res.data.poNumber} created as draft`); onSaved() }
      else showError('Error', res.error)
    } finally { setLoading(false) }
  }

  return (
    <ModalShell panelClassName="max-w-3xl space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">Create Purchase Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vendor */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Vendor *</label>
            <select value={form.vendorId} onChange={e => setForm(p => ({ ...p, vendorId: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500 transition-all">
              <option value="">Select active vendor...</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.legalName} ({v.vendorCode})</option>)}
            </select>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Line Items *</label>
              <button type="button" onClick={addItem} className="text-xs text-violet-600 font-bold hover:text-violet-700 flex items-center space-x-1">
                <Plus size={12} /><span>Add Item</span>
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description *</label>
                    <input type="text" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Item name..." className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Qty *</label>
                    <input type="number" value={item.quantityOrdered} onChange={e => updateItem(idx, 'quantityOrdered', e.target.value)} min="1" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unit</label>
                    <input type="text" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} placeholder="pcs" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Price (₹) *</label>
                    <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} min="0" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-violet-500" />
                  </div>
                  <div className="flex items-end">
                    {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 transition-all mt-1">Remove</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Preview */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-right space-y-1 text-sm">
            <div className="text-slate-500">Subtotal: <strong className="text-slate-800">₹{totals.subtotal.toFixed(2)}</strong></div>
            <div className="text-slate-500">Tax (GST): <strong className="text-slate-800">₹{totals.taxTotal.toFixed(2)}</strong></div>
            <div className="text-violet-700 text-base font-black">Grand Total: ₹{totals.grandTotal.toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Delivery Address *</label>
              <input type="text" value={form.deliveryAddress} onChange={e => setForm(p => ({ ...p, deliveryAddress: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Expected Delivery Date</label>
              <input type="date" value={form.expectedDeliveryDate} onChange={e => setForm(p => ({ ...p, expectedDeliveryDate: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500 transition-all" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50">
              {loading ? 'Creating...' : 'Create PO Draft'}
            </button>
          </div>
        </form>
    </ModalShell>
  )
}

export default function PurchaseOrders() {
  const [pos, setPos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreate, setShowCreate] = useState(false)
  const { showSuccess, showError } = useAlert()
  const auth = getAuthOrNull()
  const navigate = useNavigate()

  const canCreate = ['admin', 'super_admin', 'manager'].includes(auth?.role)

  const fetchPOs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get('/api/purchase-orders')
      if (res.success) setPos(res.data)
      else showError('Load Error', res.error)
    } catch (err) { showError('Network Error', err.message) }
    finally { setIsLoading(false) }
  }, [showError])

  useEffect(() => { fetchPOs() }, [fetchPOs])

  const filtered = pos.filter(po => {
    const matchSearch = !searchQuery || po.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || po.vendorName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || po.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusGroups = ['ALL', 'DRAFT', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'ACTIVE', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED']

  return (
    <div className="space-y-6 animate-fadeIn">
      {showCreate && <CreatePOModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchPOs() }} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight text-slate-800">Purchase Orders</h1>
          <p className="text-xs text-slate-500 mt-1">Manage all purchase orders from creation to closure</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center space-x-2 transition-all shadow-sm shadow-violet-600/20 self-start">
            <Plus size={15} /><span>Create PO</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="space-y-3 p-4 premium-card">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by PO number or vendor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border-none rounded-lg py-2 pl-9 pr-4 text-xs focus:bg-white focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all" />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusGroups.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s === 'ALL' ? 'All' : (statusConfig[s]?.label || s)}
              {s !== 'ALL' && <span className="ml-1.5 text-[11px] opacity-70">{pos.filter(p => p.status === s).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* PO Table */}
      <div className="premium-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No purchase orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4 text-right">Grand Total</th>
                  <th className="px-6 py-4">Expected Delivery</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                {filtered.map(po => (
                  <tr key={po._id} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => navigate(`/purchase-orders/${po._id}`)}>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-violet-600">{po.poNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{po.vendorName}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{po.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">₹{(po.grandTotal || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusConfig[po.status]?.color || 'bg-slate-100 text-slate-500'}`}>
                        {statusConfig[po.status]?.label || po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/purchase-orders/${po._id}`} onClick={e => e.stopPropagation()} className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-1.5 px-4 rounded-lg transition-all inline-flex items-center space-x-1">
                        <span>View</span><ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
