import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FaTrash,
    FaSearch,
    FaDownload,
    FaExternalLinkAlt,
    FaCheckSquare,
    FaSquare,
} from "react-icons/fa";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./ResponseSheetSubmissions.css";

const ResponseSheetSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/v3/admin/submissions`, {
                params: {
                    page,
                    limit: 20,
                    search: searchTerm,
                },
            });

            if (response.data.success) {
                setSubmissions(response.data.submissions);
                setTotalPages(response.data.totalPages);
                setTotal(response.data.total);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [page, searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchSubmissions();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.length === submissions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(submissions.map((s) => s._id));
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((i) => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this submission?"))
            return;

        try {
            setDeleteLoading(true);
            const response = await axios.delete(
                `/api/v3/admin/submissions/${id}`,
            );
            if (response.data.success) {
                fetchSubmissions();
                setSelectedIds(selectedIds.filter((i) => i !== id));
            }
        } catch (error) {
            console.error("Error deleting submission:", error);
            alert("Failed to delete submission");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (
            !window.confirm(
                `Are you sure you want to delete ${selectedIds.length} submissions?`,
            )
        )
            return;

        try {
            setDeleteLoading(true);
            const response = await axios.post(
                `/api/v3/admin/submissions/bulk-delete`,
                {
                    ids: selectedIds,
                },
            );
            if (response.data.success) {
                fetchSubmissions();
                setSelectedIds([]);
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert("Failed to delete submissions");
        } finally {
            setDeleteLoading(false);
        }
    };

    const exportToCSV = () => {
        if (submissions.length === 0) return;

        const headers = [
            "Application No",
            "Candidate Name",
            "Roll No",
            "Subject",
            "Test Date",
            "Test Time",
            "Submitted At",
        ];
        const csvRows = [headers.join(",")];

        submissions.forEach((sub) => {
            const row = [
                sub.applicationNo || "",
                `"${sub.candidateName || ""}"`,
                sub.rollNo || "",
                sub.subject || "",
                sub.testDate || "",
                sub.testTime || "",
                formatDate(sub.createdAt),
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `response_sheet_submissions_${
                new Date().toISOString().split("T")[0]
            }.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            <div className="rss-container">
                <div className="rss-header">
                    <div className="rss-title-section">
                        <h1>Response Sheet Submissions</h1>
                        <span className="rss-count">
                            {total} total submissions
                        </span>
                    </div>
                    <div className="rss-actions">
                        <button
                            className="rss-export-btn"
                            onClick={exportToCSV}
                            disabled={submissions.length === 0}
                        >
                            <FaDownload /> Export CSV
                        </button>
                        {selectedIds.length > 0 && (
                            <button
                                className="rss-bulk-delete-btn"
                                onClick={handleBulkDelete}
                                disabled={deleteLoading}
                            >
                                <FaTrash /> Delete Selected (
                                {selectedIds.length})
                            </button>
                        )}
                    </div>
                </div>

                <div className="rss-search-bar">
                    <form onSubmit={handleSearch}>
                        <div className="rss-search-input-wrapper">
                            <FaSearch className="rss-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name, application no, roll no, or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </form>
                </div>

                <div className="rss-table-container">
                    {loading ? (
                        <div className="rss-loading">
                            Loading submissions...
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="rss-empty">No submissions found</div>
                    ) : (
                        <table className="rss-table">
                            <thead>
                                <tr>
                                    <th className="rss-checkbox-col">
                                        <button
                                            className="rss-select-all-btn"
                                            onClick={handleSelectAll}
                                        >
                                            {selectedIds.length ===
                                            submissions.length ? (
                                                <FaCheckSquare className="checked" />
                                            ) : (
                                                <FaSquare />
                                            )}
                                        </button>
                                    </th>
                                    <th>Application No</th>
                                    <th>Candidate Name</th>
                                    <th>Roll No</th>
                                    <th>Subject</th>
                                    <th>Test Date</th>
                                    <th>Submitted At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((submission) => (
                                    <tr key={submission._id}>
                                        <td className="rss-checkbox-col">
                                            <button
                                                className="rss-select-btn"
                                                onClick={() =>
                                                    handleSelectOne(
                                                        submission._id,
                                                    )
                                                }
                                            >
                                                {selectedIds.includes(
                                                    submission._id,
                                                ) ? (
                                                    <FaCheckSquare className="checked" />
                                                ) : (
                                                    <FaSquare />
                                                )}
                                            </button>
                                        </td>
                                        <td>
                                            {submission.applicationNo || "-"}
                                        </td>
                                        <td className="rss-name-cell">
                                            {submission.candidateName || "-"}
                                        </td>
                                        <td>{submission.rollNo || "-"}</td>
                                        <td>{submission.subject || "-"}</td>
                                        <td>{submission.testDate || "-"}</td>
                                        <td>
                                            {formatDate(submission.createdAt)}
                                        </td>
                                        <td className="rss-actions-cell">
                                            {submission.link && (
                                                <a
                                                    href={submission.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="rss-view-btn"
                                                    title="View Response Sheet"
                                                >
                                                    <FaExternalLinkAlt />
                                                </a>
                                            )}
                                            <button
                                                className="rss-delete-btn"
                                                onClick={() =>
                                                    handleDelete(submission._id)
                                                }
                                                disabled={deleteLoading}
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="rss-pagination">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ResponseSheetSubmissions;
