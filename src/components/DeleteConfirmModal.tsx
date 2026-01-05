
function DeleteConfirmModal({
    clientName,
    onConfirm,
    onCancel,
}: {
    clientName: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Confirmer la suppression</h3>
                <p className="text-slate-600 mb-6">
                    Êtes-vous sûr de vouloir supprimer le client <strong>{clientName}</strong> ?
                    Cette action est irréversible.
                </p>
                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}
