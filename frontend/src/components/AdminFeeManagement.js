import React, { useState, useEffect } from 'react';
import { feeService, userService } from '../services/api';
import './AdminFeeManagement.css';

const AdminFeeManagement = () => {
  const [activeTab, setActiveTab] = useState('all'); // all, create, queries
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [feeForm, setFeeForm] = useState({
    studentId: '',
    tuitionFee: '',
    examFee: '',
    libraryFee: '',
    labFee: '',
    otherCharges: '',
    dueDate: '',
    semester: '',
    academicYear: '2025-2026'
  });

  const [responseForm, setResponseForm] = useState({
    queryId: null,
    response: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'all' || activeTab === 'create') {
        console.log('📊 Loading fees and students...');
        const [feesRes, studentsRes] = await Promise.all([
          feeService.getAllFees().catch(err => {
            console.error('❌ Error loading fees:', err);
            return { data: { fees: [] } };
          }),
          userService.getStudents().catch(err => {
            console.error('❌ Error loading students:', err);
            return { data: { students: [] } };
          })
        ]);
        
        console.log('✅ Fees loaded:', feesRes.data.fees?.length || 0);
        console.log('✅ Students loaded:', studentsRes.data.students?.length || 0);
        
        setFees(feesRes.data.fees || []);
        setStudents(studentsRes.data.students || []);
      }
      if (activeTab === 'queries') {
        console.log('📧 Loading queries...');
        const queriesRes = await feeService.getAllQueries().catch(err => {
          console.error('❌ Error loading queries:', err);
          return { data: { queries: [] } };
        });
        setQueries(queriesRes.data.queries || []);
      }
    } catch (err) {
      console.error('❌ Critical error loading data:', err);
      console.error('Error details:', err.response?.data || err.message);
      showError('Failed to load data. Please try again.');
    }
    setLoading(false);
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await feeService.createFee(feeForm);
      showMessage('✅ Fee structure created successfully!');
      setFeeForm({
        studentId: '',
        tuitionFee: '',
        examFee: '',
        libraryFee: '',
        labFee: '',
        otherCharges: '',
        dueDate: '',
        semester: '',
        academicYear: '2025-2026'
      });
      loadData();
    } catch (err) {
      console.error('Error creating fee:', err);
      showError(err.response?.data?.message || 'Failed to create fee');
    }
    setLoading(false);
  };

  const handleDeleteFee = async (feeId) => {
    if (!window.confirm('Are you sure you want to delete this fee record?')) return;
    
    try {
      await feeService.deleteFee(feeId);
      showMessage('✅ Fee record deleted successfully!');
      loadData();
    } catch (err) {
      console.error('Error deleting fee:', err);
      showError('Failed to delete fee record');
    }
  };

  const handleRespondToQuery = async (queryId) => {
    if (!responseForm.response.trim()) {
      showError('Please enter a response');
      return;
    }

    try {
      await feeService.respondToQuery(queryId, responseForm.response);
      showMessage('✅ Response sent successfully!');
      setResponseForm({ queryId: null, response: '' });
      loadData();
    } catch (err) {
      console.error('Error responding to query:', err);
      showError('Failed to send response');
    }
  };

  const getTotalFee = () => {
    return (
      parseFloat(feeForm.tuitionFee || 0) +
      parseFloat(feeForm.examFee || 0) +
      parseFloat(feeForm.libraryFee || 0) +
      parseFloat(feeForm.labFee || 0) +
      parseFloat(feeForm.otherCharges || 0)
    );
  };

  return (
    <div className="admin-fee-management">
      <div className="fee-header">
        <h2>💰 Fee Management System</h2>
        <div className="tab-buttons">
          <button 
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            📋 All Fees
          </button>
          <button 
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create Fee
          </button>
          <button 
            className={activeTab === 'queries' ? 'active' : ''}
            onClick={() => setActiveTab('queries')}
          >
            ❓ Fee Queries
          </button>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* All Fees Tab */}
      {activeTab === 'all' && (
        <div className="fees-list">
          <h3>All Student Fees</h3>
          {loading ? (
            <div className="spinner"></div>
          ) : fees.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">💰</span>
              <h4>No Fee Records</h4>
              <p>Create fee structures for students</p>
            </div>
          ) : (
            <div className="fees-table-container">
              <table className="fees-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Semester</th>
                    <th>Total Fee</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map(fee => (
                    <tr key={fee.id}>
                      <td>{fee.student?.fullName || 'N/A'}</td>
                      <td>{fee.student?.studentId || fee.student?.email}</td>
                      <td>{fee.semester || 'N/A'}</td>
                      <td>₹{parseFloat(fee.totalFee).toLocaleString()}</td>
                      <td className="paid-amount">₹{parseFloat(fee.paidAmount).toLocaleString()}</td>
                      <td className="pending-amount">₹{parseFloat(fee.pendingAmount).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${fee.status}`}>
                          {fee.status === 'paid' && '✅ Paid'}
                          {fee.status === 'partial' && '⏳ Partial'}
                          {fee.status === 'pending' && '❌ Pending'}
                        </span>
                      </td>
                      <td>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button 
                          className="btn-delete-small"
                          onClick={() => handleDeleteFee(fee.id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Fee Tab */}
      {activeTab === 'create' && (
        <div className="create-fee-section">
          <h3>Create Fee Structure</h3>
          <form onSubmit={handleCreateFee} className="fee-form">
            <div className="form-row">
              <div className="form-group">
                <label>Select Student *</label>
                <select
                  value={feeForm.studentId}
                  onChange={(e) => setFeeForm({...feeForm, studentId: e.target.value})}
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Semester</label>
                <input
                  type="text"
                  value={feeForm.semester}
                  onChange={(e) => setFeeForm({...feeForm, semester: e.target.value})}
                  placeholder="e.g., Semester 7"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Academic Year</label>
                <input
                  type="text"
                  value={feeForm.academicYear}
                  onChange={(e) => setFeeForm({...feeForm, academicYear: e.target.value})}
                  placeholder="e.g., 2025-2026"
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={feeForm.dueDate}
                  onChange={(e) => setFeeForm({...feeForm, dueDate: e.target.value})}
                />
              </div>
            </div>

            <h4>Fee Breakdown</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Tuition Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={feeForm.tuitionFee}
                  onChange={(e) => setFeeForm({...feeForm, tuitionFee: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Exam Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={feeForm.examFee}
                  onChange={(e) => setFeeForm({...feeForm, examFee: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Library Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={feeForm.libraryFee}
                  onChange={(e) => setFeeForm({...feeForm, libraryFee: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Lab Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={feeForm.labFee}
                  onChange={(e) => setFeeForm({...feeForm, labFee: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Other Charges (₹)</label>
              <input
                type="number"
                step="0.01"
                value={feeForm.otherCharges}
                onChange={(e) => setFeeForm({...feeForm, otherCharges: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div className="total-fee-display">
              <h3>Total Fee: ₹{getTotalFee().toLocaleString()}</h3>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : '💰 Create Fee Structure'}
            </button>
          </form>
        </div>
      )}

      {/* Queries Tab */}
      {activeTab === 'queries' && (
        <div className="queries-section">
          <h3>Student Fee Queries</h3>
          {loading ? (
            <div className="spinner"></div>
          ) : queries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">❓</span>
              <h4>No Queries</h4>
              <p>No fee queries from students</p>
            </div>
          ) : (
            <div className="queries-list">
              {queries.map(query => (
                <div key={query.id} className="query-card">
                  <div className="query-header">
                    <div>
                      <h4>{query.student?.fullName || 'Unknown Student'}</h4>
                      <p className="query-subject">{query.subject}</p>
                    </div>
                    <span className={`status-badge ${query.status}`}>
                      {query.status}
                    </span>
                  </div>
                  <p className="query-message">{query.message}</p>
                  <p className="query-date">
                    Submitted: {new Date(query.createdAt).toLocaleString()}
                  </p>

                  {query.adminResponse && (
                    <div className="admin-response">
                      <strong>Admin Response:</strong>
                      <p>{query.adminResponse}</p>
                      <p className="response-date">
                        Responded: {new Date(query.responseDate).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {query.status === 'pending' && (
                    <div className="response-form">
                      {responseForm.queryId === query.id ? (
                        <>
                          <textarea
                            value={responseForm.response}
                            onChange={(e) => setResponseForm({...responseForm, response: e.target.value})}
                            placeholder="Enter your response..."
                            rows="3"
                          />
                          <div className="response-buttons">
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleRespondToQuery(query.id)}
                            >
                              Send Response
                            </button>
                            <button 
                              className="btn btn-secondary"
                              onClick={() => setResponseForm({ queryId: null, response: '' })}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button 
                          className="btn btn-secondary"
                          onClick={() => setResponseForm({ queryId: query.id, response: '' })}
                        >
                          💬 Respond
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFeeManagement;
