
import Link from 'next/link';
import { Activity, Server, Database, Globe, MoreVertical, Search, PlusCircle } from 'lucide-react';
import { Card } from '@repo/ui/card';

export default function SuperAdminHome() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Topbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">S</div>
             <span className="font-bold text-lg tracking-wide text-white">Super Portal</span>
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">V1.0</span>
         </div>
         <div className="flex items-center gap-4">
             <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Documentation</button>
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"></div>
         </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
                <p className="text-slate-500">Monitoring status of {Date().split(' ').slice(0, 4).join(' ')}</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                <PlusCircle className="w-4 h-4" />
                New Tenant
            </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Globe className="w-24 h-24 text-blue-500" />
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Active Tenants</p>
                    <h2 className="text-4xl font-bold text-white">1,248</h2>
                    <div className="flex items-center gap-2 mt-4 text-sm text-green-400">
                        <Activity className="w-4 h-4" />
                        <span>All systems operational</span>
                    </div>
                </div>
            </div>
             <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Database className="w-24 h-24 text-purple-500" />
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-medium text-slate-400 mb-1">Database Queries / sec</p>
                    <h2 className="text-4xl font-bold text-white">45.2k</h2>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-purple-500 w-[65%] rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
             <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Server className="w-24 h-24 text-emerald-500" />
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-medium text-slate-400 mb-1">Server Health</p>
                    <h2 className="text-4xl font-bold text-white">99.9%</h2>
                     <div className="flex gap-1 mt-4">
                        {[1,2,3,4,5,6,7,8,9,10].map(i => (
                            <div key={i} className={`h-2 flex-1 rounded-sm ${i === 10 ? 'bg-yellow-500' : 'bg-emerald-500'}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-semibold text-white">Recent Tenants</h3>
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search tenants..." className="bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-64 transition-all" />
                </div>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Tenant Name</th>
                        <th className="px-6 py-4">Domain</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Revenue</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {[
                        { name: 'Trung Tâm Tiếng Trung HN', domain: 'hanoi.lms.com', status: 'Active', revenue: '$1,200' },
                        { name: 'English Center Pro', domain: 'englishpro.lms.com', status: 'Active', revenue: '$3,450' },
                        { name: 'Coding Bootcamp', domain: 'code.lms.com', status: 'Warning', revenue: '$850' },
                        { name: 'Japanese Kyoto', domain: 'kyoto.lms.com', status: 'Active', revenue: '$2,100' },
                    ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">{row.domain}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    row.status === 'Active' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                        row.status === 'Active' ? 'bg-emerald-400' : 'bg-yellow-400'
                                    }`}></span>
                                    {row.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-300">{row.revenue}</td>
                            <td className="px-6 py-4 text-right">
                                <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
