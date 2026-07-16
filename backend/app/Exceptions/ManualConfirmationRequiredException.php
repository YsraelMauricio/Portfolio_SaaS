<?php

namespace App\Exceptions;

use Exception;

class ManualConfirmationRequiredException extends Exception
{
    /**
     * Create a new exception instance.
     */
    public function __construct(string $message = 'Bank transfer payments require manual admin confirmation. No webhook processing is possible.')
    {
        parent::__construct($message);
    }
}
