<?php

namespace App\Policies;

use App\Models\Admin;
use App\Models\BusinessInfo;
use Illuminate\Auth\Access\HandlesAuthorization;

class BusinessInfoPolicy
{
    use HandlesAuthorization;

    public function update(Admin $admin, BusinessInfo $businessInfo)
    {
        return $admin->id === $businessInfo->admin_id;
    }

    public function delete(Admin $admin, BusinessInfo $businessInfo)
    {
        return $admin->id === $businessInfo->admin_id;
    }
}
