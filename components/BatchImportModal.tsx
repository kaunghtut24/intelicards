
import React, { useState, useCallback } from 'react';
import { PartialContact } from '../types';
import { parseVcf, parseCsv } from '../services/fileParserService';
import { IconX, IconUpload, IconFileImport, IconCheckCircle, IconExclamationTriangle } from './icons';
import Spinner from './Spinner';

interface BatchImportModalProps {
  onClose: () => void;
  onImport: (contacts: PartialContact[]) => void;
}

interface ParsedResult {
    contacts: { data: PartialContact; originalIndex: number }[];
    errors: { message: string; rowIndex: number }[];
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({ onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const resetState = useCallback(() => {
        setFile(null);
        setParsedResult(null);
        setIsParsing(false);
        setDragOver(false);
    }, []);
    
    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileParse = useCallback(async (selectedFile: File) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setIsParsing(true);
        setParsedResult(null);

        const extension = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!['vcf', 'vcard', 'csv'].includes(extension || '')) {
            setParsedResult({ contacts: [], errors: [{ message: "Invalid file type. Please upload a .vcf or .csv file.", rowIndex: 0 }] });
            setIsParsing(false);
            return;
        }

        try {
            const text = await selectedFile.text();
            let result: { contacts: PartialContact[], errors: { message: string, rowIndex: number }[] };

            if (extension === 'vcf' || extension === 'vcard') {
                result = parseVcf(text);
            } else { // csv file
                result = parseCsv(text);
            }
            
            setParsedResult({
                contacts: result.contacts.map((c, i) => ({ data: c, originalIndex: i })),
                errors: result.errors,
            });

        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred during parsing.";
            setParsedResult({ contacts: [], errors: [{ message, rowIndex: 0 }] });
        } finally {
            setIsParsing(false);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileParse(selectedFile);
        }
        e.target.value = ''; // Allow re-uploading the same file
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const selectedFile = e.dataTransfer.files?.[0];
        if (selectedFile) {
            handleFileParse(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleConfirmImport = () => {
        if (parsedResult && parsedResult.contacts.length > 0) {
            onImport(parsedResult.contacts.map(c => c.data));
        }
    };

    const renderFileDropZone = () => (
        <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center transition-colors ${dragOver ? 'border-blue-500 bg-gray-700/50' : 'hover:border-blue-500'}`}
        >
            <div className="flex flex-col items-center justify-center h-[120px]">
                <IconUpload className="mx-auto h-12 w-12 text-gray-400"/>
                <label htmlFor="batch-file-upload" className="relative cursor-pointer mt-2 text-sm text-blue-400 font-semibold focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500">
                    <span>Choose a file</span>
                    <input id="batch-file-upload" name="batch-file-upload" type="file" className="sr-only" accept="text/vcard,.vcf,.vcard,text/csv,.csv" onChange={handleFileChange} />
                </label>
                <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                <p className="text-xs text-gray-500">Supports multi-entry VCF and CSV files</p>
            </div>
        </div>
    );
    
    const renderParsingState = () => (
         <div className="flex flex-col items-center justify-center h-[164px]">
            <Spinner />
            <p className="mt-4 text-blue-400">Parsing {file?.name || 'file'}...</p>
        </div>
    );
    
    const renderResults = () => {
        if (!parsedResult) return null;
        const { contacts, errors } = parsedResult;

        return (
            <div className="flex flex-col space-y-4">
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg text-white mb-2">Parse Results for <span className="text-blue-400">{file?.name}</span></h3>
                    <div className="flex space-x-4">
                        <div className="flex items-center text-green-400">
                            <IconCheckCircle className="h-5 w-5 mr-2" />
                            <span>{contacts.length} valid contact(s) found</span>
                        </div>
                        <div className="flex items-center text-yellow-400">
                             <IconExclamationTriangle className="h-5 w-5 mr-2" />
                             <span>{errors.length} row(s) skipped</span>
                        </div>
                    </div>
                </div>

                {contacts.length > 0 && (
                    <div className="max-h-60 overflow-y-auto bg-gray-900/50 p-2 rounded-lg">
                         <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Email</th>
                                    <th className="px-4 py-2">Company</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {contacts.map(({ data, originalIndex }) => (
                                    <tr key={originalIndex}>
                                        <td className="px-4 py-2 font-medium text-white truncate">{data.name}</td>
                                        <td className="px-4 py-2 text-gray-300 truncate">{data.email}</td>
                                        <td className="px-4 py-2 text-gray-300 truncate">{data.company}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {errors.length > 0 && (
                     <div className="max-h-40 overflow-y-auto bg-red-900/20 p-2 rounded-lg">
                         <h4 className="font-semibold text-red-300 p-2">Errors</h4>
                         <ul className="text-sm text-red-400 space-y-1">
                             {errors.map((error, index) => (
                                 <li key={index} className="bg-red-900/30 p-2 rounded-md">
                                     {error.rowIndex > 0 && <span className="font-bold mr-2">(Row {error.rowIndex})</span>}
                                     {error.message}
                                 </li>
                             ))}
                         </ul>
                     </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-30 flex items-center justify-center animate-fade-in-fast backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white flex items-center">
                  <IconFileImport className="h-6 w-6 mr-3 text-blue-400" />
                  Batch Import Contacts
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-white">
                <IconX className="h-6 w-6" />
              </button>
            </div>
    
            <div className="p-6 overflow-y-auto">
              {!file && !isParsing && renderFileDropZone()}
              {isParsing && renderParsingState()}
              {parsedResult && renderResults()}
            </div>
    
            <div className="p-4 border-t border-gray-700 mt-auto bg-gray-800/50 flex justify-between items-center">
                <button onClick={resetState} type="button" className={`text-blue-400 hover:underline text-sm ${!file && 'invisible'}`}>
                    Import another file
                </button>
                <div className="flex space-x-3">
                    <button onClick={handleClose} type="button" className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmImport} 
                        type="button" 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors" 
                        disabled={isParsing || !parsedResult || parsedResult.contacts.length === 0}
                    >
                        Import {parsedResult?.contacts?.length || ''} Contact(s)
                    </button>
                </div>
            </div>
          </div>
        </div>
    );
};

export default BatchImportModal;
