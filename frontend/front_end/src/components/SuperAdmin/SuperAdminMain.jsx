import React from "react";
import CreateTenantModal from "./CreateTenanctModal";

export default function SuperAdminMain() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  return (
    <div>
      <button onClick={() => setShowCreateModal(true)}>
        create new tenant
      </button>

      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
